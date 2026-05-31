import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import {
  BookingSource,
  BookingStatus,
  Payment,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SepayWebhookPayload } from './dto/sepay-webhook-payload.dto';
import { SepayService } from './sepay.service';
import { NotificationService } from '../notification/notification.service';
import { TopUpService } from '../top-up/top-up.service';

@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private sepayService: SepayService,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => TopUpService))
    private topUpService: TopUpService,
  ) {}

  verifyRequest(authHeader?: string) {
    if (!this.sepayService.verifyWebhookAuthorization(authHeader)) {
      throw new ForbiddenException('Invalid webhook authorization');
    }
  }

  async markPaymentAsPaid(
    paymentId: number,
    sepayTransactionId?: number | string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: { select: { id: true, source: true, status: true } },
      },
    });
    if (!payment) return;

    const shouldAutoConfirm =
      payment.booking.status === BookingStatus.PENDING &&
      (payment.booking.source === BookingSource.WEB_WALK_IN ||
        payment.booking.source === BookingSource.MOBILE_APP);

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionId:
            sepayTransactionId != null ? String(sepayTransactionId) : undefined,
        },
      }),
      ...(shouldAutoConfirm
        ? [
            this.prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: BookingStatus.CONFIRMED },
            }),
          ]
        : []),
    ]);

    if (shouldAutoConfirm) {
      this.logger.log(
        `Booking ${payment.bookingId} (${payment.booking.source}) auto-confirmed after bank payment`,
      );
      try {
        await this.notificationService.dispatchBookingConfirmed(
          payment.bookingId,
          {
            walkInBankPaid:
              payment.booking.source === BookingSource.WEB_WALK_IN,
          },
        );
      } catch (err) {
        this.logger.warn(
          `Confirm notification failed: ${String(err)}`,
        );
      }
    }
  }

  async findPendingBankPayment(
    paymentCode: string,
  ): Promise<Payment | null> {
    const normalized = paymentCode.toUpperCase();
    return this.prisma.payment.findFirst({
      where: {
        sepayPaymentCode: { equals: normalized, mode: 'insensitive' },
        status: PaymentStatus.PENDING,
        method: 'BANK_TRANSFER',
      },
    });
  }

  async findPendingBankPaymentFromPayload(
    payload: SepayWebhookPayload,
  ): Promise<Payment | null> {
    const candidates = this.sepayService.collectPaymentCodeCandidates(payload);

    for (const code of candidates) {
      const payment = await this.findPendingBankPayment(code);
      if (payment) return payment;
    }

    const content = payload.content ?? '';
    if (!content.trim()) return null;

    const pending = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        method: 'BANK_TRANSFER',
        sepayPaymentCode: { not: null },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    for (const payment of pending) {
      if (
        payment.sepayPaymentCode &&
        this.sepayService.contentIncludesPaymentCode(
          content,
          payment.sepayPaymentCode,
        )
      ) {
        return payment;
      }
    }

    return null;
  }

  /** Đồng bộ từ SePay User API khi poll GET /bookings/:id/payment-status. */
  async tryReconcilePendingPayment(payment: Payment): Promise<boolean> {
    if (
      payment.status !== PaymentStatus.PENDING ||
      payment.method !== 'BANK_TRANSFER' ||
      !payment.sepayPaymentCode
    ) {
      return false;
    }

    const match = await this.sepayService.findIncomingTransactionForPayment(
      payment.sepayPaymentCode,
      payment.amount,
      payment.createdAt,
    );

    if (!match) return false;

    await this.markPaymentAsPaid(payment.id, match.sepayTransactionId);
    this.logger.log(
      `Reconciled payment ${payment.id} via SePay API tx=${match.sepayTransactionId}`,
    );
    return true;
  }

  async handleIncomingTransfer(payload: SepayWebhookPayload) {
    if (payload.transferType !== 'in') {
      return { success: true, skipped: 'not_incoming' };
    }

    try {
      await this.prisma.sepayWebhookEvent.create({
        data: {
          sepayTransactionId: payload.id,
          payload: payload as object,
        },
      });
    } catch {
      this.logger.log(`Duplicate SePay webhook id=${payload.id}, skipping`);
      return { success: true, skipped: 'duplicate' };
    }

    const codes = this.sepayService.collectPaymentCodeCandidates(payload);
    for (const code of codes) {
      const topUpOrder = await this.topUpService.findPendingByPaymentCode(code);
      if (topUpOrder) {
        if (payload.transferAmount < topUpOrder.priceVnd) {
          this.logger.warn(
            `Webhook ${payload.id}: top-up amount ${payload.transferAmount} < ${topUpOrder.priceVnd}`,
          );
          return { success: true, skipped: 'amount_insufficient' };
        }
        await this.topUpService.markOrderPaid(topUpOrder.id, payload.id);
        this.logger.log(
          `Top-up order ${topUpOrder.id} paid via SePay webhook ${payload.id}`,
        );
        return { success: true, topUpOrderId: topUpOrder.id };
      }
    }

    const payment = await this.findPendingBankPaymentFromPayload(payload);
    if (!payment) {
      this.logger.warn(
        `Webhook ${payload.id}: no pending payment for codes [${codes.join(', ')}] content="${payload.content ?? ''}"`,
      );
      return { success: true, skipped: 'payment_not_found' };
    }

    if (payload.transferAmount < payment.amount) {
      this.logger.warn(
        `Webhook ${payload.id}: amount ${payload.transferAmount} < ${payment.amount}`,
      );
      return { success: true, skipped: 'amount_insufficient' };
    }

    if (payment.expiresAt && payment.expiresAt < new Date()) {
      this.logger.warn(`Webhook ${payload.id}: payment expired`);
      return { success: true, skipped: 'expired' };
    }

    await this.markPaymentAsPaid(payment.id, payload.id);

    this.logger.log(
      `Payment received for walk-in booking ${payment.bookingId} via SePay webhook ${payload.id}`,
    );

    return { success: true, bookingId: payment.bookingId };
  }
}

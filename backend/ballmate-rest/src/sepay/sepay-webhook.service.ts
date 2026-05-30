import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Payment, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SepayWebhookPayload } from './dto/sepay-webhook-payload.dto';
import { SepayService } from './sepay.service';

@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private sepayService: SepayService,
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
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        transactionId:
          sepayTransactionId != null ? String(sepayTransactionId) : undefined,
      },
    });
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

  /** Đồng bộ từ SePay User API khi poll payment-status (fallback nếu webhook chưa tới). */
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

    const payment = await this.findPendingBankPaymentFromPayload(payload);
    if (!payment) {
      const codes = this.sepayService.collectPaymentCodeCandidates(payload);
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

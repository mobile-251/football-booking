import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  PaymentStatus,
} from '@prisma/client';
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

    const paymentCode = this.sepayService.extractPaymentCodeFromPayload(payload);
    if (!paymentCode) {
      this.logger.warn(`Webhook ${payload.id}: no payment code matched`);
      return { success: true, skipped: 'no_code' };
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        sepayPaymentCode: paymentCode,
        status: PaymentStatus.PENDING,
        method: 'BANK_TRANSFER',
      },
      include: { booking: true },
    });

    if (!payment) {
      this.logger.warn(
        `Webhook ${payload.id}: no pending payment for code ${paymentCode}`,
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

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionId: String(payload.id),
        },
      }),
    ]);

    this.logger.log(
      `Payment received for walk-in booking ${payment.bookingId} via SePay ${payload.id} — awaiting owner confirmation`,
    );

    return { success: true, bookingId: payment.bookingId };
  }
}

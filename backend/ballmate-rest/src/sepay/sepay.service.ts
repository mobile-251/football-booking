import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../config/configuration';

@Injectable()
export class SepayService {
  private readonly config: AppConfiguration['sepay'];

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<AppConfiguration['sepay']>('sepay')!;
  }

  getPaymentCode(bookingCode: string): string {
    return bookingCode;
  }

  getExpiresAt(): Date {
    const d = new Date();
    d.setMinutes(d.getMinutes() + this.config.paymentTtlMinutes);
    return d;
  }

  buildQrImageUrl(amount: number, paymentCode: string): string {
    const { accountNumber, bankName } = this.config;
    if (!accountNumber?.trim()) {
      throw new BadRequestException(
        'Chưa cấu hình SEPAY_ACCOUNT_NUMBER trong .env — cần số TK ngân hàng liên kết SePay để tạo QR',
      );
    }

    const params = new URLSearchParams({
      acc: accountNumber.trim(),
      bank: bankName.trim() || 'MSB',
      amount: String(Math.round(amount)),
      des: paymentCode,
    });

    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  verifyWebhookAuthorization(authHeader?: string): boolean {
    const expected = this.config.webhookApiKey?.trim();
    if (!expected) {
      return process.env.NODE_ENV !== 'production';
    }
    if (!authHeader) return false;

    const normalized = authHeader.trim();
    if (normalized === expected) return true;
    if (normalized === `Apikey ${expected}`) return true;
    if (normalized === `Bearer ${expected}`) return true;
    return false;
  }

  extractPaymentCodeFromPayload(payload: {
    code?: string | null;
    content?: string;
  }): string | null {
    if (payload.code?.trim()) {
      return payload.code.trim();
    }
    const content = payload.content ?? '';
    const prefix = this.config.paymentCodePrefix;
    const regex = new RegExp(`${prefix}[A-Z0-9]{6,}`, 'i');
    const match = content.match(regex);
    return match ? match[0].toUpperCase() : null;
  }
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../config/configuration';

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);
  private readonly config: AppConfiguration['sepay'];

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<AppConfiguration['sepay']>('sepay')!;
  }

  getPaymentCode(bookingCode: string): string {
    return bookingCode.toUpperCase();
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
      des: paymentCode.toUpperCase(),
    });

    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  resolveAuthorizationHeader(
    headers: Record<string, string | string[] | undefined>,
  ): string | undefined {
    const direct =
      headers.authorization ??
      headers.Authorization ??
      headers['x-sepay-api-key'];
    if (Array.isArray(direct)) return direct[0];
    return direct;
  }

  verifyWebhookAuthorization(authHeader?: string): boolean {
    const expected = this.config.webhookApiKey?.trim();
    if (!expected) {
      return process.env.NODE_ENV !== 'production';
    }
    if (!authHeader) return false;

    const normalized = authHeader.trim();
    const lower = normalized.toLowerCase();
    const expectedLower = expected.toLowerCase();

    if (normalized === expected) return true;
    if (lower === `apikey ${expectedLower}`) return true;
    if (lower === `bearer ${expectedLower}`) return true;
    return false;
  }

  collectPaymentCodeCandidates(payload: {
    code?: string | null;
    content?: string;
  }): string[] {
    const candidates = new Set<string>();
    const content = payload.content ?? '';
    const prefix = this.config.paymentCodePrefix;

    if (payload.code?.trim()) {
      candidates.add(payload.code.trim().toUpperCase());
    }

    const primary = new RegExp(`${prefix}[A-Z0-9]{6,}`, 'i');
    const primaryMatch = content.match(primary);
    if (primaryMatch) {
      candidates.add(primaryMatch[0].toUpperCase());
    }

    const loose = new RegExp(`\\b${prefix}[A-Z0-9]{4,12}\\b`, 'gi');
    for (const match of content.matchAll(loose)) {
      candidates.add(match[0].toUpperCase());
    }

    return [...candidates];
  }

  extractPaymentCodeFromPayload(payload: {
    code?: string | null;
    content?: string;
  }): string | null {
    const candidates = this.collectPaymentCodeCandidates(payload);
    return candidates[0] ?? null;
  }

  contentIncludesPaymentCode(
    content: string | null | undefined,
    paymentCode: string,
  ): boolean {
    if (!content?.trim()) return false;
    return content.toUpperCase().includes(paymentCode.toUpperCase());
  }

  hasUserApiToken(): boolean {
    return Boolean(this.config.userApiToken?.trim());
  }

  /** Poll SePay User API khi webhook chưa tới (cần SEPAY_USER_API_TOKEN). */
  async findIncomingTransactionForPayment(
    paymentCode: string,
    minAmount: number,
    since: Date,
  ): Promise<{ sepayTransactionId: number | string; amount: number } | null> {
    const token = this.config.userApiToken?.trim();
    if (!token) return null;

    const minDate = since.toISOString().slice(0, 10);
    const url = new URL('https://my.sepay.vn/userapi/transactions/list');
    url.searchParams.set('limit', '100');
    url.searchParams.set('transaction_date_min', minDate);

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.logger.warn(
          `SePay user API ${res.status} — kiểm tra SEPAY_USER_API_TOKEN`,
        );
        return null;
      }

      const data = (await res.json()) as {
        transactions?: Record<string, unknown>[];
        data?: Record<string, unknown>[];
      };
      const rows = data.transactions ?? data.data ?? [];
      const codeUpper = paymentCode.toUpperCase();

      for (const row of rows) {
        const content = String(
          row.transaction_content ?? row.content ?? '',
        );
        const rowCode = String(row.code ?? '').toUpperCase();
        const amountIn = Number(row.amount_in ?? row.transferAmount ?? 0);
        const transferType = String(row.transferType ?? row.transfer_type ?? 'in');

        if (transferType && transferType !== 'in') continue;
        if (amountIn < minAmount) continue;

        const matched =
          rowCode === codeUpper ||
          this.contentIncludesPaymentCode(content, codeUpper);

        if (!matched) continue;

        const txId = row.id ?? row.transaction_id;
        if (txId == null) continue;

        return { sepayTransactionId: txId as number | string, amount: amountIn };
      }
    } catch (err) {
      this.logger.warn(`SePay user API error: ${String(err)}`);
    }

    return null;
  }
}

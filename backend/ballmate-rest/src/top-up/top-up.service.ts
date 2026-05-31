import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CoinTransactionType,
  TopUpOrderStatus,
  TopUpPurpose,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SepayService } from '../sepay/sepay.service';
import { WalletService } from '../wallet/wallet.service';
import { AppConfiguration } from '../config/configuration';
import {
  COIN_VND_RATE,
  coinToVnd,
  decimalToNumber,
  toDecimal,
  vndToCoin,
} from '../common/coin.util';
import { CreateTopUpOrderDto } from './dto/create-top-up-order.dto';
import { BookingCoinService } from '../booking/booking-coin.service';
import { ComboService } from '../combo/combo.service';
import { DEFAULT_TOP_UP_PACKAGES } from './default-top-up-packages';

@Injectable()
export class TopUpService {
  private readonly topUpTtlMinutes: number;

  constructor(
    private prisma: PrismaService,
    private sepayService: SepayService,
    private walletService: WalletService,
    @Inject(forwardRef(() => BookingCoinService))
    private bookingCoinService: BookingCoinService,
    @Inject(forwardRef(() => ComboService))
    private comboService: ComboService,
    configService: ConfigService,
  ) {
    const coin = configService.get<AppConfiguration['coin']>('coin');
    this.topUpTtlMinutes = coin?.topUpOrderTtlMinutes ?? 15;
  }

  private async ensureDefaultPackages() {
    const count = await this.prisma.topUpPackage.count();
    if (count > 0) return;
    await this.prisma.topUpPackage.createMany({
      data: DEFAULT_TOP_UP_PACKAGES.map((p) => ({
        name: p.name,
        priceVnd: p.priceVnd,
        baseCoin: p.baseCoin,
        bonusCoin: p.bonusCoin,
        sortOrder: p.sortOrder,
        isActive: true,
      })),
    });
  }

  async listPackages() {
    await this.ensureDefaultPackages();
    const packages = await this.prisma.topUpPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return packages.map((p) => ({
      ...p,
      baseCoin: decimalToNumber(p.baseCoin),
      bonusCoin: decimalToNumber(p.bonusCoin),
      totalCoin: decimalToNumber(p.baseCoin) + decimalToNumber(p.bonusCoin),
    }));
  }

  private generatePaymentCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BMTP${suffix}`;
  }

  private async uniquePaymentCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = this.generatePaymentCode();
      const exists = await this.prisma.topUpOrder.findUnique({
        where: { paymentCode: code },
      });
      if (!exists) return code;
    }
    return `BMTP${Date.now().toString(36).toUpperCase()}`;
  }

  async createOrder(playerId: number, dto: CreateTopUpOrderDto) {
    await this.walletService.ensurePlayerExists(playerId);

    let priceVnd: number;
    let baseCoin: number;
    let bonusCoin = 0;

    if (dto.packageId) {
      const pkg = await this.prisma.topUpPackage.findFirst({
        where: { id: dto.packageId, isActive: true },
      });
      if (!pkg) throw new NotFoundException('Top-up package not found');
      priceVnd = pkg.priceVnd;
      baseCoin = decimalToNumber(pkg.baseCoin);
      bonusCoin = decimalToNumber(pkg.bonusCoin);
    } else if (dto.amountVnd && dto.amountVnd >= COIN_VND_RATE) {
      priceVnd = Math.round(dto.amountVnd);
      baseCoin = vndToCoin(priceVnd);
    } else {
      throw new BadRequestException(
        'Provide packageId or amountVnd (min 1000 VND)',
      );
    }

    const expectedCoin = baseCoin + bonusCoin;
    const paymentCode = await this.uniquePaymentCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.topUpTtlMinutes);

    const qrUrl = this.sepayService.buildQrImageUrl(priceVnd, paymentCode);

    const order = await this.prisma.topUpOrder.create({
      data: {
        playerId,
        packageId: dto.packageId ?? null,
        paymentCode,
        priceVnd,
        baseCoin: toDecimal(baseCoin),
        bonusCoin: toDecimal(bonusCoin),
        expectedCoin: toDecimal(expectedCoin),
        purpose: dto.purpose ?? TopUpPurpose.WALLET_TOPUP,
        holdId: dto.holdId ?? null,
        comboPackageId: dto.comboPackageId ?? null,
        status: TopUpOrderStatus.PENDING,
        sepayQrUrl: qrUrl,
        expiresAt,
      },
    });

    return {
      id: order.id,
      paymentCode: order.paymentCode,
      priceVnd: order.priceVnd,
      baseCoin,
      bonusCoin,
      expectedCoin,
      purpose: order.purpose,
      status: order.status,
      sepayQrUrl: order.sepayQrUrl,
      expiresAt: order.expiresAt,
    };
  }

  /** Poll từ app: thử khớp giao dịch SePay User API nếu webhook chưa tới. */
  private async tryReconcilePendingOrder(order: {
    id: number;
    status: string;
    paymentCode: string;
    priceVnd: number;
    createdAt: Date;
  }): Promise<void> {
    if (order.status !== TopUpOrderStatus.PENDING) return;
    const match = await this.sepayService.findIncomingTransactionForPayment(
      order.paymentCode,
      order.priceVnd,
      order.createdAt,
    );
    if (match) {
      await this.markOrderPaid(order.id, match.sepayTransactionId);
    }
  }

  async getOrder(playerId: number, orderId: number) {
    let order = await this.prisma.topUpOrder.findFirst({
      where: { id: orderId, playerId },
    });
    if (!order) throw new NotFoundException('Top-up order not found');

    await this.tryReconcilePendingOrder(order);
    order =
      (await this.prisma.topUpOrder.findFirst({
        where: { id: orderId, playerId },
      })) ?? order;

    const balance = await this.walletService.getBalance(playerId);
    return {
      id: order.id,
      status: order.status,
      paymentCode: order.paymentCode,
      priceVnd: order.priceVnd,
      expectedCoin: decimalToNumber(order.expectedCoin),
      sepayQrUrl: order.sepayQrUrl,
      expiresAt: order.expiresAt,
      paidAt: order.paidAt,
      balance,
    };
  }

  async findPendingByPaymentCode(code: string) {
    const normalized = code.toUpperCase();
    return this.prisma.topUpOrder.findFirst({
      where: {
        paymentCode: { equals: normalized, mode: 'insensitive' },
        status: TopUpOrderStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markOrderPaid(
    orderId: number,
    sepayTransactionId?: number | string,
  ): Promise<void> {
    const order = await this.prisma.topUpOrder.findUnique({
      where: { id: orderId },
    });
    if (!order || order.status !== TopUpOrderStatus.PENDING) return;

    const baseCoin = decimalToNumber(order.baseCoin);
    const bonusCoin = decimalToNumber(order.bonusCoin);

    await this.prisma.$transaction(async (tx) => {
      await tx.topUpOrder.update({
        where: { id: orderId },
        data: {
          status: TopUpOrderStatus.PAID,
          paidAt: new Date(),
          sepayMeta: sepayTransactionId
            ? { sepayTransactionId: String(sepayTransactionId) }
            : undefined,
        },
      });

      await this.walletService.credit(
        {
          playerId: order.playerId,
          amount: baseCoin,
          type: CoinTransactionType.TOP_UP,
          referenceType: 'TOP_UP_ORDER',
          referenceId: orderId,
          description: `Nạp ${order.priceVnd.toLocaleString('vi-VN')}đ`,
        },
        tx,
      );

      if (bonusCoin > 0) {
        await this.walletService.credit(
          {
            playerId: order.playerId,
            amount: bonusCoin,
            type: CoinTransactionType.TOP_UP_BONUS,
            referenceType: 'TOP_UP_ORDER',
            referenceId: orderId,
            description: 'Thưởng nạp coin',
          },
          tx,
        );
      }
    });

    if (order.purpose === TopUpPurpose.BOOKING_JIT && order.holdId) {
      await this.bookingCoinService.fulfillHoldAfterTopUp(
        order.holdId,
        order.playerId,
      );
    } else if (
      order.purpose === TopUpPurpose.COMBO_JIT &&
      order.comboPackageId
    ) {
      await this.comboService.purchaseAfterTopUp(
        order.playerId,
        order.comboPackageId,
      );
    }
  }

  suggestPackageForMissingCoin(missingCoin: number) {
    return this.prisma.topUpPackage.findFirst({
      where: {
        isActive: true,
        baseCoin: { gte: toDecimal(missingCoin) },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

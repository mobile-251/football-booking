import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingSource,
  BookingStatus,
  CoinTransactionType,
  PlayerComboStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import {
  calculateBookingPriceVnd,
} from '../field/booking-pricing.util';
import {
  COIN_VND_RATE,
  coinToVnd,
  decimalToNumber,
  toDecimal,
  vndToCoin,
} from '../common/coin.util';
import { ConfirmCoinBookingDto, PreviewCoinBookingDto } from './dto/confirm-coin-booking.dto';
import { AppConfiguration } from '../config/configuration';

export interface CoinBookingBreakdown {
  fieldCoin: number;
  servicesCoin: number;
  totalCoin: number;
  totalPriceVnd: number;
  usedCombo: boolean;
}

@Injectable()
export class BookingCoinService {
  private readonly holdTtlMinutes: number;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    configService: ConfigService,
  ) {
    const coin = configService.get<AppConfiguration['coin']>('coin');
    this.holdTtlMinutes = coin?.bookingHoldTtlMinutes ?? 15;
  }

  async preview(dto: PreviewCoinBookingDto): Promise<CoinBookingBreakdown> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    return this.calculateTotals(dto.fieldId, start, end, dto.playerComboId, dto.services);
  }

  private async calculateTotals(
    fieldId: number,
    start: Date,
    end: Date,
    playerComboId?: number,
    services?: { venueServiceId: number; quantity: number }[],
  ): Promise<CoinBookingBreakdown> {
    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: { pricings: true, venue: true },
    });
    if (!field) throw new NotFoundException('Field not found');

    const { totalPrice: totalPriceVnd } = calculateBookingPriceVnd(
      field.pricings,
      start,
      end,
    );
    let fieldCoin = vndToCoin(totalPriceVnd);
    let usedCombo = false;

    if (playerComboId) {
      const pc = await this.prisma.playerCombo.findFirst({
        where: {
          id: playerComboId,
          status: PlayerComboStatus.ACTIVE,
          matchesRemaining: { gt: 0 },
          expiresAt: { gt: new Date() },
          comboPackage: {
            venueId: field.venueId,
            fieldType: field.fieldType,
          },
        },
      });
      if (pc) {
        fieldCoin = 0;
        usedCombo = true;
      }
    }

    let servicesCoin = 0;
    if (services?.length) {
      for (const item of services) {
        const svc = await this.prisma.venueService.findFirst({
          where: {
            id: item.venueServiceId,
            venueId: field.venueId,
            isActive: true,
          },
        });
        if (!svc) {
          throw new BadRequestException(`Service ${item.venueServiceId} not found`);
        }
        servicesCoin +=
          decimalToNumber(svc.priceCoin) * Math.max(1, item.quantity);
      }
    }

    const totalCoin = fieldCoin + servicesCoin;
    return {
      fieldCoin,
      servicesCoin,
      totalCoin,
      totalPriceVnd: usedCombo ? 0 : totalPriceVnd,
      usedCombo,
    };
  }

  private async checkSlotConflict(
    fieldId: number,
    start: Date,
    end: Date,
    excludeHoldId?: number,
  ) {
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        fieldId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        OR: [
          { AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }] },
          { AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }] },
          { AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }] },
        ],
      },
    });
    if (conflictingBooking) {
      throw new ConflictException('This time slot is already booked');
    }

    const now = new Date();
    const activeHolds = await this.prisma.bookingHold.findMany({
      where: {
        fieldId,
        expiresAt: { gt: now },
        ...(excludeHoldId ? { id: { not: excludeHoldId } } : {}),
      },
    });
    for (const hold of activeHolds) {
      if (
        hold.startTime < end &&
        hold.endTime > start
      ) {
        throw new ConflictException('Slot is temporarily held');
      }
    }
  }

  private generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async generateUniqueBookingCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = this.generateBookingCode();
      const existing = await this.prisma.booking.findUnique({
        where: { bookingCode: code },
      });
      if (!existing) return code;
    }
    return `BM${Date.now().toString(36).toUpperCase()}`;
  }

  async confirm(dto: ConfirmCoinBookingDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    await this.checkSlotConflict(dto.fieldId, start, end);

    const breakdown = await this.calculateTotals(
      dto.fieldId,
      start,
      end,
      dto.playerComboId,
      dto.services,
    );

    const balance = await this.walletService.getBalance(dto.playerId);

    if (balance < breakdown.totalCoin) {
      const missingCoin = breakdown.totalCoin - balance;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.holdTtlMinutes);

      const hold = await this.prisma.bookingHold.create({
        data: {
          fieldId: dto.fieldId,
          playerId: dto.playerId,
          startTime: start,
          endTime: end,
          totalCoin: toDecimal(breakdown.totalCoin),
          payload: dto as unknown as Prisma.InputJsonValue,
          expiresAt,
        },
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'NEED_TOPUP',
          missingCoin,
          missingVnd: coinToVnd(missingCoin),
          holdId: hold.id,
          totalCoin: breakdown.totalCoin,
          balance,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.createConfirmedBooking(dto, breakdown);
  }

  async fulfillHoldAfterTopUp(holdId: number, playerId: number) {
    const hold = await this.prisma.bookingHold.findFirst({
      where: { id: holdId, playerId },
    });
    if (!hold || hold.expiresAt < new Date()) {
      throw new BadRequestException('Booking hold expired or not found');
    }

    const dto = hold.payload as unknown as ConfirmCoinBookingDto;
    const breakdown = await this.calculateTotals(
      dto.fieldId,
      hold.startTime,
      hold.endTime,
      dto.playerComboId,
      dto.services,
    );

    const balance = await this.walletService.getBalance(playerId);
    if (balance < breakdown.totalCoin) {
      throw new BadRequestException('Still insufficient balance after top-up');
    }

    await this.checkSlotConflict(
      dto.fieldId,
      hold.startTime,
      hold.endTime,
      holdId,
    );

    const booking = await this.createConfirmedBooking(dto, breakdown, holdId);
    await this.prisma.bookingHold.delete({ where: { id: holdId } });
    return booking;
  }

  private async createConfirmedBooking(
    dto: ConfirmCoinBookingDto,
    breakdown: CoinBookingBreakdown,
    holdId?: number,
  ) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    const bookingCode = await this.generateUniqueBookingCode();
    const totalPriceVnd = breakdown.usedCombo
      ? coinToVnd(breakdown.servicesCoin)
      : breakdown.totalPriceVnd + coinToVnd(breakdown.servicesCoin);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          fieldId: dto.fieldId,
          playerId: dto.playerId,
          source: BookingSource.MOBILE_APP,
          startTime: start,
          endTime: end,
          totalPrice: totalPriceVnd,
          totalCoin: toDecimal(breakdown.totalCoin),
          status: BookingStatus.CONFIRMED,
          note: dto.note,
          extrasJson: dto.extrasJson
            ? (dto.extrasJson as Prisma.InputJsonValue)
            : undefined,
        },
      });

      if (dto.services?.length) {
        for (const item of dto.services) {
          const svc = await tx.venueService.findUniqueOrThrow({
            where: { id: item.venueServiceId },
          });
          const unit = decimalToNumber(svc.priceCoin);
          const lineTotal = unit * item.quantity;
          await tx.bookingService.create({
            data: {
              bookingId: booking.id,
              venueServiceId: item.venueServiceId,
              quantity: item.quantity,
              priceCoinAtBooking: toDecimal(unit),
              totalCoin: toDecimal(lineTotal),
            },
          });
        }
      }

      if (breakdown.totalCoin > 0) {
        const fieldSpend = breakdown.fieldCoin;
        const serviceSpend = breakdown.servicesCoin;
        if (fieldSpend > 0) {
          await this.walletService.debit(
            {
              playerId: dto.playerId,
              amount: fieldSpend,
              type: CoinTransactionType.BOOKING_SPEND,
              referenceType: 'BOOKING',
              referenceId: booking.id,
              description: `Đặt sân ${bookingCode}`,
            },
            tx,
          );
        }
        if (serviceSpend > 0) {
          await this.walletService.debit(
            {
              playerId: dto.playerId,
              amount: serviceSpend,
              type: CoinTransactionType.SERVICE_SPEND,
              referenceType: 'BOOKING',
              referenceId: booking.id,
              description: `Dịch vụ kèm ${bookingCode}`,
            },
            tx,
          );
        }
      }

      if (dto.playerComboId && breakdown.usedCombo) {
        const pc = await tx.playerCombo.update({
          where: { id: dto.playerComboId },
          data: { matchesRemaining: { decrement: 1 } },
        });
        await tx.bookingComboUsage.create({
          data: {
            bookingId: booking.id,
            playerComboId: dto.playerComboId,
            matchesConsumed: 1,
          },
        });
        if (pc.matchesRemaining <= 1) {
          await tx.playerCombo.update({
            where: { id: dto.playerComboId },
            data: { status: PlayerComboStatus.EXHAUSTED },
          });
        }
      }

      if (holdId) {
        await tx.bookingHold.delete({ where: { id: holdId } }).catch(() => {});
      }

      try {
        await this.notificationService.dispatchBookingConfirmed(booking.id);
      } catch {
        /* non-fatal */
      }

      return booking;
    });
  }
}

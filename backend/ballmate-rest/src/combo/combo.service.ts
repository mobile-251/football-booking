import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CoinTransactionType,
  PlayerComboStatus,
  TopUpPurpose,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { decimalToNumber, toDecimal, coinToVnd } from '../common/coin.util';

@Injectable()
export class ComboService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async listByVenue(venueId: number) {
    const packages = await this.prisma.comboPackage.findMany({
      where: { venueId, isActive: true, deletedAt: null },
      orderBy: { fieldType: 'asc' },
    });
    return packages.map((p) => ({
      ...p,
      priceCoin: decimalToNumber(p.priceCoin),
      pricePerMatch: decimalToNumber(p.priceCoin) / p.matchCount,
    }));
  }

  async listMyCombos(playerId: number) {
    const combos = await this.prisma.playerCombo.findMany({
      where: {
        playerId,
        status: { in: [PlayerComboStatus.ACTIVE] },
        expiresAt: { gt: new Date() },
        matchesRemaining: { gt: 0 },
      },
      include: { comboPackage: { include: { venue: true } } },
      orderBy: { expiresAt: 'asc' },
    });
    return combos;
  }

  async getEligibleForBooking(
    playerId: number,
    venueId: number,
    fieldType: string,
  ) {
    return this.prisma.playerCombo.findMany({
      where: {
        playerId,
        status: PlayerComboStatus.ACTIVE,
        matchesRemaining: { gt: 0 },
        expiresAt: { gt: new Date() },
        comboPackage: { venueId, fieldType: fieldType as never },
      },
      include: { comboPackage: true },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async purchase(playerId: number, comboPackageId: number) {
    const pkg = await this.prisma.comboPackage.findFirst({
      where: { id: comboPackageId, isActive: true, deletedAt: null },
    });
    if (!pkg) throw new NotFoundException('Combo package not found');

    const priceCoin = decimalToNumber(pkg.priceCoin);
    const balance = await this.walletService.getBalance(playerId);

    if (balance < priceCoin) {
      const missingCoin = priceCoin - balance;
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'NEED_TOPUP',
          missingCoin,
          missingVnd: coinToVnd(missingCoin),
          comboPackageId,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.createPlayerCombo(playerId, pkg.id, priceCoin, pkg);
  }

  async purchaseAfterTopUp(playerId: number, comboPackageId: number) {
    const pkg = await this.prisma.comboPackage.findFirstOrThrow({
      where: { id: comboPackageId, isActive: true },
    });
    const priceCoin = decimalToNumber(pkg.priceCoin);
    return this.createPlayerCombo(playerId, pkg.id, priceCoin, pkg);
  }

  private async createPlayerCombo(
    playerId: number,
    comboPackageId: number,
    priceCoin: number,
    pkg: { matchCount: number; validityDays: number; name: string },
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

    return this.prisma.$transaction(async (tx) => {
      await this.walletService.debit(
        {
          playerId,
          amount: priceCoin,
          type: CoinTransactionType.COMBO_PURCHASE,
          referenceType: 'COMBO_PACKAGE',
          referenceId: comboPackageId,
          description: `Mua gói ${pkg.name}`,
        },
        tx,
      );

      return tx.playerCombo.create({
        data: {
          playerId,
          comboPackageId,
          expiresAt,
          matchesTotal: pkg.matchCount,
          matchesRemaining: pkg.matchCount,
          status: PlayerComboStatus.ACTIVE,
        },
        include: { comboPackage: true },
      });
    });
  }

  async createPackage(
    venueId: number,
    data: {
      fieldType: string;
      name: string;
      description?: string;
      matchCount: number;
      priceCoin: number;
      validityDays: number;
    },
  ) {
    return this.prisma.comboPackage.create({
      data: {
        venueId,
        fieldType: data.fieldType as never,
        name: data.name,
        description: data.description,
        matchCount: data.matchCount,
        priceCoin: toDecimal(data.priceCoin),
        validityDays: data.validityDays,
      },
    });
  }

  async updatePackage(
    id: number,
    venueId: number,
    data: Partial<{
      name: string;
      description: string;
      matchCount: number;
      priceCoin: number;
      validityDays: number;
      isActive: boolean;
    }>,
  ) {
    const pkg = await this.prisma.comboPackage.findFirst({
      where: { id, venueId },
    });
    if (!pkg) throw new NotFoundException('Combo package not found');
    return this.prisma.comboPackage.update({
      where: { id },
      data: {
        ...data,
        priceCoin:
          data.priceCoin != null ? toDecimal(data.priceCoin) : undefined,
      },
    });
  }

  async deletePackage(id: number, venueId: number) {
    return this.prisma.comboPackage.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

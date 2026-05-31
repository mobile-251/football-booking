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
      orderBy: [{ fieldType: 'asc' }, { priceCoin: 'asc' }],
    });
    return packages.map((p) => this.mapPackage(p));
  }

  /** Owner/manager: all packages including inactive (not soft-deleted). */
  async listByVenueForManagement(venueId: number) {
    const packages = await this.prisma.comboPackage.findMany({
      where: { venueId, deletedAt: null },
      orderBy: [{ fieldType: 'asc' }, { isActive: 'desc' }, { priceCoin: 'asc' }],
    });
    return packages.map((p) => this.mapPackage(p));
  }

  private mapPackage(p: {
    id: number;
    venueId: number;
    fieldType: string;
    name: string;
    description: string | null;
    matchCount: number;
    priceCoin: { toString(): string } | number;
    validityDays: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const priceCoin = decimalToNumber(p.priceCoin);
    return {
      ...p,
      priceCoin,
      pricePerMatch: Math.round((priceCoin / p.matchCount) * 100) / 100,
      description: p.description ?? undefined,
    };
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
    const created = await this.prisma.comboPackage.create({
      data: {
        venueId,
        fieldType: data.fieldType as never,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        matchCount: data.matchCount,
        priceCoin: toDecimal(data.priceCoin),
        validityDays: data.validityDays,
      },
    });
    return this.mapPackage(created);
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
    const updated = await this.prisma.comboPackage.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        matchCount: data.matchCount,
        priceCoin:
          data.priceCoin != null ? toDecimal(data.priceCoin) : undefined,
        validityDays: data.validityDays,
        isActive: data.isActive,
      },
    });
    return this.mapPackage(updated);
  }

  async deletePackage(id: number, venueId: number) {
    const pkg = await this.prisma.comboPackage.findFirst({
      where: { id, venueId, deletedAt: null },
    });
    if (!pkg) throw new NotFoundException('Combo package not found');
    return this.prisma.comboPackage.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CoinTransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decimalToNumber, toDecimal } from '../common/coin.util';

export interface WalletCreditInput {
  playerId: number;
  amount: number;
  type: CoinTransactionType;
  referenceType?: string;
  referenceId?: number;
  description?: string;
}

export interface WalletDebitInput {
  playerId: number;
  amount: number;
  type: CoinTransactionType;
  referenceType?: string;
  referenceId?: number;
  description?: string;
}

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateWallet(playerId: number) {
    const existing = await this.prisma.wallet.findUnique({
      where: { playerId },
    });
    if (existing) return existing;

    return this.prisma.wallet.create({
      data: { playerId, coinBalance: 0 },
    });
  }

  async getBalance(playerId: number): Promise<number> {
    const wallet = await this.getOrCreateWallet(playerId);
    return decimalToNumber(wallet.coinBalance);
  }

  async getWalletWithTransactions(
    playerId: number,
    page = 1,
    limit = 20,
  ) {
    const wallet = await this.getOrCreateWallet(playerId);
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coinTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      balance: decimalToNumber(wallet.coinBalance),
      transactions: transactions.map((t) => ({
        ...t,
        amount: decimalToNumber(t.amount),
        balanceAfter: decimalToNumber(t.balanceAfter),
      })),
      pagination: { page, limit, total },
    };
  }

  async credit(
    input: WalletCreditInput,
    tx?: Prisma.TransactionClient,
  ) {
    if (input.amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }
    const client = tx ?? this.prisma;
    const wallet = await this.getOrCreateWalletInTx(client, input.playerId);
    const newBalance = decimalToNumber(wallet.coinBalance) + input.amount;

    await client.wallet.update({
      where: { id: wallet.id },
      data: { coinBalance: toDecimal(newBalance) },
    });

    await client.coinTransaction.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        amount: toDecimal(input.amount),
        balanceAfter: toDecimal(newBalance),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
      },
    });

    return newBalance;
  }

  async debit(
    input: WalletDebitInput,
    tx?: Prisma.TransactionClient,
  ) {
    if (input.amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }
    const client = tx ?? this.prisma;
    const wallet = await this.getOrCreateWalletInTx(client, input.playerId);
    const balance = decimalToNumber(wallet.coinBalance);
    if (balance < input.amount) {
      throw new BadRequestException('Insufficient coin balance');
    }
    const newBalance = balance - input.amount;

    await client.wallet.update({
      where: { id: wallet.id },
      data: { coinBalance: toDecimal(newBalance) },
    });

    await client.coinTransaction.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        amount: toDecimal(-input.amount),
        balanceAfter: toDecimal(newBalance),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
      },
    });

    return newBalance;
  }

  private async getOrCreateWalletInTx(
    client: Prisma.TransactionClient,
    playerId: number,
  ) {
    let wallet = await client.wallet.findUnique({ where: { playerId } });
    if (!wallet) {
      wallet = await client.wallet.create({
        data: { playerId, coinBalance: 0 },
      });
    }
    return wallet;
  }

  async ensurePlayerExists(playerId: number) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }
}

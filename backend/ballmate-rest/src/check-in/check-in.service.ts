import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { CoinTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { decimalToNumber, toDecimal } from '../common/coin.util';

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

function todayDateKey(): Date {
  const now = new Date();
  const local = new Date(now.getTime() + TZ_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
}

function yesterdayDateKey(): Date {
  const t = todayDateKey();
  t.setUTCDate(t.getUTCDate() - 1);
  return t;
}

function rewardForStreakDay(streakDay: number): number {
  if (streakDay <= 2) return 1;
  return Math.min(
    30,
    Math.round(1 + ((streakDay - 2) * 29) / 28),
  );
}

@Injectable()
export class CheckInService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async getStatus(playerId: number) {
    const today = todayDateKey();
    const todayCheckIn = await this.prisma.checkIn.findUnique({
      where: { playerId_date: { playerId, date: today } },
    });

    const configs = await this.prisma.checkInRewardConfig.findMany({
      orderBy: { streakDay: 'asc' },
    });

    let currentStreak = 0;
    if (todayCheckIn) {
      currentStreak = todayCheckIn.streakCount;
    } else {
      const yesterday = yesterdayDateKey();
      const y = await this.prisma.checkIn.findUnique({
        where: { playerId_date: { playerId, date: yesterday } },
      });
      currentStreak = y?.streakCount ?? 0;
    }

    const nextStreak = todayCheckIn
      ? currentStreak
      : currentStreak > 0
        ? currentStreak + 1
        : 1;

    const previewDays: { day: number; coin: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = ((nextStreak - 1 + i) % 30) + 1;
      const cfg = configs.find((c) => c.streakDay === day);
      previewDays.push({
        day: nextStreak + i,
        coin: cfg
          ? decimalToNumber(cfg.coinReward)
          : rewardForStreakDay(day),
      });
    }

    return {
      checkedInToday: !!todayCheckIn,
      currentStreak,
      todayReward: todayCheckIn
        ? decimalToNumber(todayCheckIn.coinRewarded)
        : rewardForStreakDay(nextStreak > 30 ? 30 : nextStreak),
      previewDays,
    };
  }

  async checkIn(playerId: number) {
    const today = todayDateKey();
    const existing = await this.prisma.checkIn.findUnique({
      where: { playerId_date: { playerId, date: today } },
    });
    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    const yesterday = yesterdayDateKey();
    const prev = await this.prisma.checkIn.findUnique({
      where: { playerId_date: { playerId, date: yesterday } },
    });

    let streakCount = 1;
    if (prev) {
      streakCount = prev.streakCount >= 30 ? 1 : prev.streakCount + 1;
    }

    const config = await this.prisma.checkInRewardConfig.findUnique({
      where: { streakDay: streakCount },
    });
    const coinReward = config
      ? decimalToNumber(config.coinReward)
      : rewardForStreakDay(streakCount);

    await this.prisma.$transaction(async (tx) => {
      await tx.checkIn.create({
        data: {
          playerId,
          date: today,
          streakCount,
          coinRewarded: toDecimal(coinReward),
        },
      });
      await this.walletService.credit(
        {
          playerId,
          amount: coinReward,
          type: CoinTransactionType.CHECKIN_REWARD,
          referenceType: 'CHECK_IN',
          description: `Điểm danh ngày ${streakCount}`,
        },
        tx,
      );
    });

    return {
      streakCount,
      coinRewarded: coinReward,
      message: `+${coinReward} coin`,
    };
  }
}

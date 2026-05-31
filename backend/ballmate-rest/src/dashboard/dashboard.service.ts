import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingSource,
  BookingStatus,
  CoinTransactionType,
  PaymentStatus,
  Prisma,
  TopUpOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { coinToVnd, decimalToNumber } from '../common/coin.util';

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

const REVENUE_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

type ComboTxRow = { amount: Prisma.Decimal; createdAt: Date };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseHour(time?: string | null, fallback = 6): number {
  if (!time) return fallback;
  const [h] = time.split(':').map(Number);
  return Number.isFinite(h) ? h : fallback;
}

function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

function formatTimeHHmm(d: Date): string {
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVenueComboPackageIds(venueId: number): Promise<number[]> {
    const pkgs = await this.prisma.comboPackage.findMany({
      where: { venueId, deletedAt: null },
      select: { id: true },
    });
    return pkgs.map((p) => p.id);
  }

  private sumComboPurchaseVnd(
    txs: { amount: Prisma.Decimal }[],
  ): number {
    return txs.reduce(
      (s, t) => s + coinToVnd(Math.abs(decimalToNumber(t.amount))),
      0,
    );
  }

  async getVenueDashboard(venueId: number, userId: number) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        fields: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const comboPackageIds = await this.getVenueComboPackageIds(venueId);
    const fieldIds = venue.fields.map((f) => f.id);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(new Date(now.getTime() - 86400000));
    const yesterdayEnd = endOfDay(new Date(now.getTime() - 86400000));

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));

    const chartStart = startOfDay(new Date(now.getTime() - 6 * 86400000));

    const venueWhere: Prisma.BookingWhereInput = {
      field: { venueId },
      status: { in: REVENUE_STATUSES },
    };

    const comboTxWhere: Prisma.CoinTransactionWhereInput = {
      type: CoinTransactionType.COMBO_PURCHASE,
      referenceType: 'COMBO_PACKAGE',
      ...(comboPackageIds.length > 0
        ? { referenceId: { in: comboPackageIds } }
        : { referenceId: -1 }),
    };

    const [
      monthBookings,
      prevMonthBookings,
      monthComboTxs,
      prevMonthComboTxs,
      chartBookings,
      chartComboTxs,
      comboBookingsMonth,
      todayBookings,
      yesterdayBookings,
      todayActiveBookings,
      recentBookings,
      unreadNotifications,
      recentTopUps,
      recentComboTxs,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          ...venueWhere,
          startTime: { gte: monthStart, lte: monthEnd },
        },
        select: {
          totalPrice: true,
          startTime: true,
          endTime: true,
          comboUsage: { select: { id: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          ...venueWhere,
          startTime: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        select: { totalPrice: true, startTime: true, endTime: true },
      }),
      comboPackageIds.length > 0
        ? this.prisma.coinTransaction.findMany({
            where: {
              ...comboTxWhere,
              createdAt: { gte: monthStart, lte: monthEnd },
            },
            select: { amount: true, createdAt: true },
          })
        : Promise.resolve([] as ComboTxRow[]),
      comboPackageIds.length > 0
        ? this.prisma.coinTransaction.findMany({
            where: {
              ...comboTxWhere,
              createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
            },
            select: { amount: true, createdAt: true },
          })
        : Promise.resolve([] as ComboTxRow[]),
      this.prisma.booking.findMany({
        where: {
          ...venueWhere,
          startTime: { gte: chartStart, lte: todayEnd },
        },
        select: { totalPrice: true, startTime: true },
      }),
      comboPackageIds.length > 0
        ? this.prisma.coinTransaction.findMany({
            where: {
              ...comboTxWhere,
              createdAt: { gte: chartStart, lte: todayEnd },
            },
            select: { amount: true, createdAt: true },
          })
        : Promise.resolve([] as ComboTxRow[]),
      this.prisma.booking.count({
        where: {
          field: { venueId },
          status: { in: REVENUE_STATUSES },
          comboUsage: { isNot: null },
          startTime: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.booking.count({
        where: {
          field: { venueId },
          status: { in: ACTIVE_STATUSES },
          startTime: { lte: todayEnd },
          endTime: { gte: todayStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          field: { venueId },
          status: { in: ACTIVE_STATUSES },
          startTime: { lte: yesterdayEnd },
          endTime: { gte: yesterdayStart },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          field: { venueId },
          status: { in: ACTIVE_STATUSES },
          startTime: { lte: todayEnd },
          endTime: { gte: todayStart },
        },
        select: {
          startTime: true,
          endTime: true,
          note: true,
          status: true,
        },
      }),
      this.prisma.booking.findMany({
        where: { field: { venueId } },
        select: {
          id: true,
          customerName: true,
          startTime: true,
          endTime: true,
          totalPrice: true,
          totalCoin: true,
          status: true,
          source: true,
          field: { select: { name: true } },
          payment: { select: { status: true } },
          comboUsage: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      fieldIds.length > 0 || comboPackageIds.length > 0
        ? this.prisma.topUpOrder.findMany({
            where: {
              status: TopUpOrderStatus.PAID,
              paidAt: { not: null },
              OR: [
                ...(comboPackageIds.length > 0
                  ? [{ comboPackageId: { in: comboPackageIds } }]
                  : []),
                ...(fieldIds.length > 0
                  ? [
                      {
                        hold: { fieldId: { in: fieldIds } },
                      },
                    ]
                  : []),
              ],
            },
            include: {
              player: {
                include: { user: { select: { fullName: true } } },
              },
            },
            orderBy: { paidAt: 'desc' },
            take: 5,
          })
        : Promise.resolve([]),
      comboPackageIds.length > 0
        ? this.prisma.coinTransaction.findMany({
            where: comboTxWhere,
            include: {
              wallet: {
                include: {
                  player: {
                    include: { user: { select: { fullName: true } } },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          })
        : Promise.resolve([] as {
            id: number;
            referenceId: number | null;
            amount: Prisma.Decimal;
            createdAt: Date;
            wallet: {
              player?: { user?: { fullName?: string | null } | null } | null;
            } | null;
          }[]),
    ]);

    const monthlyBookingRevenue = monthBookings.reduce(
      (s, b) => s + b.totalPrice,
      0,
    );
    const monthlyComboRevenue = this.sumComboPurchaseVnd(monthComboTxs);
    const monthlyRevenue = monthlyBookingRevenue + monthlyComboRevenue;

    const prevBookingRevenue = prevMonthBookings.reduce(
      (s, b) => s + b.totalPrice,
      0,
    );
    const prevComboRevenue = this.sumComboPurchaseVnd(prevMonthComboTxs);
    const prevMonthlyRevenue = prevBookingRevenue + prevComboRevenue;

    const monthlyRevenueChangePercent =
      prevMonthlyRevenue > 0
        ? ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100
        : monthlyRevenue > 0
          ? 100
          : 0;

    const openHour = parseHour(venue.openTime, 6);
    const closeHour = parseHour(venue.closeTime, 23);
    const hoursPerDay = Math.max(1, closeHour - openHour);
    const fieldCount = Math.max(venue.fields.length, 1);
    const totalCapacityHours = fieldCount * hoursPerDay;

    const bookedHoursToday = todayActiveBookings.reduce(
      (s, b) => s + hoursBetween(b.startTime, b.endTime),
      0,
    );
    const occupancyRate = Math.min(
      100,
      Math.round((bookedHoursToday / totalCapacityHours) * 100),
    );

    const prevMonthBookedHours = prevMonthBookings.reduce(
      (s, b) => s + hoursBetween(b.startTime, b.endTime),
      0,
    );
    const daysInPrevMonth = prevMonthEnd.getDate();
    const avgPrevOccupancy =
      daysInPrevMonth > 0
        ? (prevMonthBookedHours / (daysInPrevMonth * totalCapacityHours)) * 100
        : 0;
    const occupancyChangePercent =
      avgPrevOccupancy > 0
        ? occupancyRate - Math.round(avgPrevOccupancy)
        : occupancyRate > 0
          ? occupancyRate
          : 0;

    const revenueChart = Array.from({ length: 7 }, (_, i) => {
      const day = startOfDay(new Date(chartStart.getTime() + i * 86400000));
      const dayEnd = endOfDay(day);
      const bookingRevenue = chartBookings
        .filter((b) => b.startTime >= day && b.startTime <= dayEnd)
        .reduce((s, b) => s + b.totalPrice, 0);
      const comboRevenue = chartComboTxs
        .filter((t) => t.createdAt >= day && t.createdAt <= dayEnd)
        .reduce(
          (s, t) => s + coinToVnd(Math.abs(decimalToNumber(t.amount))),
          0,
        );
      return {
        date: day.toISOString().slice(0, 10),
        label: DAY_LABELS[day.getDay()],
        revenue: bookingRevenue + comboRevenue,
        bookingRevenue,
        comboRevenue,
      };
    });

    const scheduleHours: number[] = [];
    for (let h = openHour; h <= closeHour; h++) {
      scheduleHours.push(h);
    }

    const todaySchedule = scheduleHours.map((hour) => {
      const slotStart = new Date(todayStart);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(todayStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const overlapping = todayActiveBookings.filter(
        (b) => b.startTime < slotEnd && b.endTime > slotStart,
      );

      const maintenance = overlapping.find((b) =>
        (b.note ?? '').toLowerCase().includes('bảo trì'),
      );

      if (maintenance) {
        return {
          hour: `${String(hour).padStart(2, '0')}:00`,
          bookingCount: 0,
          status: 'maintenance' as const,
          note: maintenance.note ?? 'Bảo trì',
        };
      }

      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        bookingCount: overlapping.length,
        status:
          overlapping.length > 0
            ? ('booked' as const)
            : ('empty' as const),
      };
    });

    type ActivityItem = {
      id: string;
      type: 'top_up' | 'combo_purchase' | 'booking';
      title: string;
      subtitle: string;
      amountVnd: number;
      createdAt: string;
    };

    const activity: ActivityItem[] = [];

    for (const order of recentTopUps) {
      if (!order.paidAt) continue;
      const name = order.player?.user?.fullName?.trim() || 'Khách';
      activity.push({
        id: `topup-${order.id}`,
        type: 'top_up',
        title: `${name} nạp coin`,
        subtitle: order.paymentCode,
        amountVnd: order.priceVnd,
        createdAt: order.paidAt.toISOString(),
      });
    }

    const comboPkgIds = [
      ...new Set(
        recentComboTxs
          .map((t) => t.referenceId)
          .filter((id): id is number => id != null),
      ),
    ];
    const comboPkgNames = new Map<number, string>();
    if (comboPkgIds.length > 0) {
      const pkgs = await this.prisma.comboPackage.findMany({
        where: { id: { in: comboPkgIds } },
        select: { id: true, name: true },
      });
      for (const p of pkgs) comboPkgNames.set(p.id, p.name);
    }

    for (const tx of recentComboTxs) {
      const coin = Math.abs(decimalToNumber(tx.amount));
      const name =
        tx.wallet?.player?.user?.fullName?.trim() || 'Khách';
      activity.push({
        id: `combo-tx-${tx.id}`,
        type: 'combo_purchase',
        title: `${name} mua gói`,
        subtitle:
          (tx.referenceId != null
            ? comboPkgNames.get(tx.referenceId)
            : undefined) ?? 'Gói combo',
        amountVnd: coinToVnd(coin),
        createdAt: tx.createdAt.toISOString(),
      });
    }

    activity.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const recentActivity = activity.slice(0, 6);

    return {
      stats: {
        monthlyRevenue,
        monthlyBookingRevenue,
        monthlyComboRevenue,
        monthlyRevenueChangePercent:
          Math.round(monthlyRevenueChangePercent * 10) / 10,
        comboBookingsThisMonth: comboBookingsMonth,
        todayBookings,
        todayBookingsChange: todayBookings - yesterdayBookings,
        occupancyRate,
        occupancyChangePercent,
        unreadNotifications,
      },
      revenueChart,
      todaySchedule,
      recentActivity,
      recentBookings: recentBookings.map((b) => {
        const totalCoin = decimalToNumber(b.totalCoin ?? 0);
        const hasComboUsage = !!b.comboUsage;
        const isComboRedemption =
          hasComboUsage ||
          (b.source === BookingSource.MOBILE_APP &&
            b.status === BookingStatus.CONFIRMED &&
            !b.payment &&
            b.totalPrice === 0 &&
            totalCoin === 0);
        const isCoinApp =
          b.source === BookingSource.MOBILE_APP &&
          totalCoin > 0 &&
          b.status === BookingStatus.CONFIRMED;
        const isPaid =
          b.payment?.status === PaymentStatus.PAID ||
          b.status === BookingStatus.COMPLETED ||
          isComboRedemption ||
          isCoinApp;

        let paymentLabel = 'Chờ thanh toán';
        if (isComboRedemption) {
          paymentLabel =
            totalCoin > 0 ? 'Gói combo + coin' : 'Gói combo';
        } else if (isCoinApp) paymentLabel = 'Ví coin';
        else if (b.payment?.status === PaymentStatus.PAID)
          paymentLabel = 'Đã thanh toán';
        else if (
          b.source === BookingSource.MOBILE_APP &&
          b.status === BookingStatus.CONFIRMED
        ) {
          paymentLabel = 'Đã thanh toán (app)';
        }

        return {
          id: b.id,
          customerName: b.customerName,
          fieldName: b.field.name,
          startTime: formatTimeHHmm(b.startTime),
          endTime: formatTimeHHmm(b.endTime),
          totalPrice: b.totalPrice,
          status: b.status,
          paymentStatus: b.payment?.status ?? PaymentStatus.PENDING,
          isPaid,
          paymentLabel,
          usedCombo: isComboRedemption,
        };
      }),
    };
  }
}

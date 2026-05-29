import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

    const [
      monthBookings,
      prevMonthBookings,
      todayBookings,
      yesterdayBookings,
      chartBookings,
      todayActiveBookings,
      recentBookings,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          ...venueWhere,
          startTime: { gte: monthStart, lte: monthEnd },
        },
        select: { totalPrice: true, startTime: true, endTime: true },
      }),
      this.prisma.booking.findMany({
        where: {
          ...venueWhere,
          startTime: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        select: { totalPrice: true, startTime: true, endTime: true },
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
          ...venueWhere,
          startTime: { gte: chartStart, lte: todayEnd },
        },
        select: { totalPrice: true, startTime: true },
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
        include: {
          field: { select: { name: true } },
          payment: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    const monthlyRevenue = monthBookings.reduce((s, b) => s + b.totalPrice, 0);
    const prevMonthlyRevenue = prevMonthBookings.reduce(
      (s, b) => s + b.totalPrice,
      0,
    );
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
      const revenue = chartBookings
        .filter((b) => b.startTime >= day && b.startTime <= dayEnd)
        .reduce((s, b) => s + b.totalPrice, 0);
      return {
        date: day.toISOString().slice(0, 10),
        label: DAY_LABELS[day.getDay()],
        revenue,
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

    return {
      stats: {
        monthlyRevenue,
        monthlyRevenueChangePercent: Math.round(monthlyRevenueChangePercent * 10) / 10,
        todayBookings,
        todayBookingsChange: todayBookings - yesterdayBookings,
        occupancyRate,
        occupancyChangePercent,
        unreadNotifications,
      },
      revenueChart,
      todaySchedule,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        customerName: b.customerName,
        fieldName: b.field.name,
        startTime: formatTimeHHmm(b.startTime),
        endTime: formatTimeHHmm(b.endTime),
        totalPrice: b.totalPrice,
        status: b.status,
        paymentStatus: b.payment?.status ?? PaymentStatus.PENDING,
        isPaid:
          b.payment?.status === PaymentStatus.PAID ||
          b.status === BookingStatus.COMPLETED,
      })),
    };
  }
}

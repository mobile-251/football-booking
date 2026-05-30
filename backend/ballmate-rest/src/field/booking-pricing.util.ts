import { BadRequestException } from '@nestjs/common';
import { DayType, FieldPricing } from '@prisma/client';

export function getDayTypeForDate(date: Date): DayType {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6 ? DayType.WEEKEND : DayType.WEEKDAY;
}

export function parseHourFromTime(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

export function findPriceForHour(
  pricings: FieldPricing[],
  dayType: DayType,
  hour: number,
): number | null {
  const dayPricings = pricings.filter((p) => p.dayType === dayType);
  for (const pricing of dayPricings) {
    const pStart = parseHourFromTime(pricing.startTime);
    const pEnd = parseHourFromTime(pricing.endTime);
    if (hour >= pStart && hour < pEnd) {
      return pricing.price;
    }
  }
  return null;
}

export function buildLocalDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min ?? 0, 0, 0);
}

export interface PriceBreakdownItem {
  startTime: string;
  endTime: string;
  price: number;
}

export function calculateBookingPriceVnd(
  pricings: FieldPricing[],
  start: Date,
  end: Date,
): { totalPrice: number; breakdown: PriceBreakdownItem[] } {
  if (start >= end) {
    throw new BadRequestException('Start time must be before end time');
  }

  const dayType = getDayTypeForDate(start);
  const breakdown: PriceBreakdownItem[] = [];
  let totalPrice = 0;

  const cursor = new Date(start);
  while (cursor < end) {
    const hour = cursor.getHours();
    const next = new Date(cursor);
    next.setHours(hour + 1, 0, 0, 0);
    const slotEnd = next > end ? end : next;

    const price = findPriceForHour(pricings, dayType, hour);
    if (price === null) {
      const slotLabel = `${hour.toString().padStart(2, '0')}:00`;
      throw new BadRequestException(
        `Sân chưa cấu hình giá cho khung giờ ${slotLabel} (${dayType === DayType.WEEKEND ? 'cuối tuần' : 'ngày thường'})`,
      );
    }

    breakdown.push({
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
      price,
    });
    totalPrice += price;
    cursor.setTime(slotEnd.getTime());
  }

  return { totalPrice, breakdown };
}

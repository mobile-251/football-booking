import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingSource,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalkInBookingDto } from './dto/create-walk-in-booking.dto';
import {
  buildLocalDateTime,
  calculateBookingPriceVnd,
} from '../field/booking-pricing.util';

@Injectable()
export class WalkInBookingService {
  constructor(private prisma: PrismaService) {}

  private generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async generateUniqueBookingCode(): Promise<string> {
    let code = this.generateBookingCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.prisma.booking.findUnique({
        where: { bookingCode: code },
      });
      if (!existing) return code;
      code = this.generateBookingCode();
      attempts++;
    }
    return `BM${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }

  async createWalkIn(
    venueId: number,
    createdByUserId: number,
    dto: CreateWalkInBookingDto,
  ) {
    const {
      fieldId,
      date,
      startTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone,
      note,
    } = dto;

    const field = await this.prisma.field.findFirst({
      where: { id: fieldId, venueId },
      include: { pricings: true },
    });

    if (!field) {
      throw new NotFoundException(
        `Field ${fieldId} not found in venue ${venueId}`,
      );
    }

    if (!field.isActive || field.operationalStatus !== 'ACTIVE') {
      throw new BadRequestException('Field is not available for booking');
    }

    const start = buildLocalDateTime(date, startTime);
    const end = buildLocalDateTime(date, endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (start < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    const { totalPrice } = calculateBookingPriceVnd(field.pricings, start, end);

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

    const bookingCode = await this.generateUniqueBookingCode();

    return this.prisma.booking.create({
      data: {
        bookingCode,
        customerName,
        customerPhone,
        customerEmail,
        fieldId,
        playerId: null,
        source: BookingSource.WEB_WALK_IN,
        createdByUserId,
        startTime: start,
        endTime: end,
        totalPrice,
        note,
        status: BookingStatus.CONFIRMED,
        payment: {
          create: {
            amount: totalPrice,
            method: PaymentMethod.CASH,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        },
      },
      include: {
        field: {
          include: {
            venue: {
              select: { id: true, name: true, address: true },
            },
          },
        },
        payment: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }
}

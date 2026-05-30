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
import {
  CreateWalkInBookingDto,
  WalkInPaymentMethod,
} from './dto/create-walk-in-booking.dto';
import {
  buildLocalDateTime,
  calculateBookingPriceVnd,
} from '../field/booking-pricing.util';
import { SepayService } from '../sepay/sepay.service';

@Injectable()
export class WalkInBookingService {
  constructor(
    private prisma: PrismaService,
    private sepayService: SepayService,
  ) {}

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
      paymentMethod = WalkInPaymentMethod.CASH,
    } = dto;

    const isBankTransfer = paymentMethod === WalkInPaymentMethod.BANK_TRANSFER;

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
    const expiresAt = isBankTransfer ? this.sepayService.getExpiresAt() : null;
    const sepayPaymentCode = isBankTransfer
      ? this.sepayService.getPaymentCode(bookingCode)
      : null;
    const sepayQrUrl =
      isBankTransfer && sepayPaymentCode
        ? this.sepayService.buildQrImageUrl(totalPrice, sepayPaymentCode)
        : null;

    const booking = await this.prisma.booking.create({
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
        status: isBankTransfer
          ? BookingStatus.PENDING
          : BookingStatus.CONFIRMED,
        payment: {
          create: {
            amount: totalPrice,
            method: isBankTransfer
              ? PaymentMethod.BANK_TRANSFER
              : PaymentMethod.CASH,
            status: isBankTransfer ? PaymentStatus.PENDING : PaymentStatus.PAID,
            paidAt: isBankTransfer ? null : new Date(),
            sepayPaymentCode,
            sepayQrUrl,
            expiresAt,
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

    if (isBankTransfer && booking.payment) {
      return {
        booking,
        payment: {
          method: booking.payment.method,
          status: booking.payment.status,
          amount: booking.payment.amount,
          sepayPaymentCode: booking.payment.sepayPaymentCode,
          qrImageUrl: booking.payment.sepayQrUrl,
          expiresAt: booking.payment.expiresAt,
        },
      };
    }

    return { booking, payment: booking.payment };
  }

  async getPaymentStatus(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.source !== BookingSource.WEB_WALK_IN) {
      throw new BadRequestException('Not a walk-in booking');
    }

    const payment = booking.payment;
    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    if (
      payment.status === PaymentStatus.PENDING &&
      payment.expiresAt &&
      payment.expiresAt < new Date()
    ) {
      await this.prisma.$transaction([
        this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        }),
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PENDING },
        }),
      ]);

      return {
        bookingId,
        bookingStatus: BookingStatus.CANCELLED,
        paymentStatus: payment.status,
        expired: true,
      };
    }

    return {
      bookingId,
      bookingStatus: booking.status,
      paymentStatus: payment.status,
      paidAt: payment.paidAt,
      expired: false,
      qrImageUrl: payment.sepayQrUrl,
      sepayPaymentCode: payment.sepayPaymentCode,
      amount: payment.amount,
      expiresAt: payment.expiresAt,
    };
  }
}

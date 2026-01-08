import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CompleteBookingDto } from './dto/complete-booking.dto';
import { BookingStatus, Prisma } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) { }

  /**
   * Generate unique booking code: BM + 6 alphanumeric chars
   * Format: BM1A2B3C
   */
  private generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for clarity
    let code = 'BM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate unique booking code, retry if collision
   */
  private async generateUniqueBookingCode(): Promise<string> {
    let code = this.generateBookingCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await this.prisma.booking.findUnique({
        where: { bookingCode: code },
      });
      if (!existing) {
        return code;
      }
      code = this.generateBookingCode();
      attempts++;
    }

    // Fallback: add timestamp suffix
    return `BM${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }

  async create(createBookingDto: CreateBookingDto) {
    const { fieldId, startTime, endTime, playerId, totalPrice, note, customerName, customerPhone } =
      createBookingDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (start < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    await this.prisma.field.findUniqueOrThrow({
      where: { id: fieldId },
    });

    await this.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
    });

    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        fieldId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        OR: [
          {
            AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
          },
          {
            AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
          },
          {
            AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictException(
        `This time slot is already booked. Conflicting booking: ${conflictingBooking.id}`,
      );
    }

    // Generate unique booking code
    const bookingCode = await this.generateUniqueBookingCode();

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        customerName,
        customerPhone,
        fieldId,
        playerId,
        startTime: start,
        endTime: end,
        totalPrice,
        note,
        status: BookingStatus.PENDING,
      },
      include: {
        field: {
          include: {
            venue: true,
          },
        },
        player: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    // Send notification for new booking
    try {
      await this.notificationService.createBookingNotification(
        booking.player.user.id,
        'confirmed',
        {
          fieldName: booking.field.name,
          date: start.toLocaleDateString('vi-VN'),
          time: start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          bookingId: booking.id,
        },
      );
    } catch (e) {
      console.error('Failed to send booking notification:', e);
    }

    return booking;
  }

  async findAll(filters?: {
    playerId?: number;
    fieldId?: number;
    venueId?: number;
    status?: BookingStatus;
  }) {
    const where: Prisma.BookingWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.playerId) where.playerId = filters.playerId;
    if (filters?.fieldId) where.fieldId = filters.fieldId;
    if (filters?.venueId) {
      where.field = {
        venueId: filters.venueId,
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        field: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        player: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Hide booking code for PENDING bookings
    return bookings.map(booking => ({
      ...booking,
      bookingCode: booking.status === BookingStatus.PENDING ? 'Chờ xác nhận' : booking.bookingCode,
    }));
  }

  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        field: {
          include: {
            venue: true,
          },
        },
        player: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.status === BookingStatus.PENDING) {
      return {
        ...booking,
        bookingCode: 'Chờ xác nhận',
      };
    }

    return booking;
  }

  async update(id: number, updateBookingDto: UpdateBookingDto) {
    await this.findOne(id);

    return this.prisma.booking.update({
      where: { id },
      data: updateBookingDto,
      include: {
        field: true,
        player: true,
      },
    });
  }

  async confirmBooking(id: number) {
    const booking = await this.findOne(id);

    // Only allow confirming PENDING bookings
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm booking with status ${booking.status}. Only PENDING bookings can be confirmed.`,
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  async cancelBooking(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        field: true,
        player: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Cannot cancel CONFIRMED bookings
    if (booking.status === BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Cannot cancel a confirmed booking. Only PENDING bookings can be cancelled.',
      );
    }

    // Cannot cancel already cancelled or completed bookings
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel booking with status ${booking.status}. Only PENDING bookings can be cancelled.`,
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // Send cancellation notification
    try {
      await this.notificationService.createBookingNotification(
        booking.player.user.id,
        'cancelled',
        {
          fieldName: booking.field.name,
          date: booking.startTime.toLocaleDateString('vi-VN'),
          time: booking.startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          bookingId: booking.id,
        },
      );
    } catch (e) {
      console.error('Failed to send cancellation notification:', e);
    }

    return updatedBooking;
  }

  /**
   * Complete booking (check-in) - Player provides booking code to Field Owner
   */
  async completeBooking(id: number, completeBookingDto: CompleteBookingDto) {
    const booking = await this.findOne(id);

    // Verify booking code matches
    if (booking.bookingCode !== completeBookingDto.bookingCode) {
      throw new BadRequestException('Invalid booking code');
    }

    // Only allow completing CONFIRMED bookings
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot complete booking with status ${booking.status}. Only CONFIRMED bookings can be completed.`,
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.COMPLETED,
      },
      include: {
        field: {
          include: {
            venue: true,
          },
        },
        player: true,
        payment: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async getFieldAvailability(fieldId: number, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        fieldId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return bookings;
  }
}

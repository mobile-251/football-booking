import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const { fieldId, startTime, endTime, playerId, totalPrice, note } =
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

    await this.prisma.user.findUniqueOrThrow({
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

    return this.prisma.booking.create({
      data: {
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

    return this.prisma.booking.findMany({
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
    await this.findOne(id);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  async cancelBooking(id: number) {
    await this.findOne(id);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
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

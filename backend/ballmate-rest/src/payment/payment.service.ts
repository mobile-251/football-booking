import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    // Check if booking exists
    await this.prisma.booking.findUniqueOrThrow({
      where: { id: createPaymentDto.bookingId },
    });

    return this.prisma.payment.create({
      data: createPaymentDto,
      include: {
        booking: {
          include: {
            field: true,
            player: true,
          },
        },
      },
    });
  }

  async findAll(status?: PaymentStatus) {
    return this.prisma.payment.findMany({
      where: status ? { status } : undefined,
      include: {
        booking: {
          include: {
            field: true,
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            field: true,
            player: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByBookingId(bookingId: number) {
    return this.prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: true,
      },
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id);

    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
    });
  }

  async confirmPayment(id: number) {
    await this.findOne(id);

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.payment.delete({
      where: { id },
    });
  }
}

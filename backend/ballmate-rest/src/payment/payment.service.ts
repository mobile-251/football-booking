import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { SepayService } from '../sepay/sepay.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private sepayService: SepayService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: createPaymentDto.bookingId },
    });

    const existing = await this.prisma.payment.findUnique({
      where: { bookingId: createPaymentDto.bookingId },
    });
    if (existing) {
      throw new ConflictException('Payment already exists for this booking');
    }

    const method =
      createPaymentDto.method ?? PaymentMethod.CASH;
    const isBankTransfer = method === PaymentMethod.BANK_TRANSFER;

    const sepayPaymentCode = isBankTransfer
      ? this.sepayService.getPaymentCode(booking.bookingCode)
      : null;
    const sepayQrUrl =
      isBankTransfer && sepayPaymentCode
        ? this.sepayService.buildQrImageUrl(
            createPaymentDto.amount,
            sepayPaymentCode,
          )
        : null;

    return this.prisma.payment.create({
      data: {
        bookingId: createPaymentDto.bookingId,
        amount: createPaymentDto.amount,
        method,
        status:
          createPaymentDto.status ??
          (isBankTransfer ? PaymentStatus.PENDING : PaymentStatus.PAID),
        transactionId: createPaymentDto.transactionId,
        sepayPaymentCode,
        sepayQrUrl,
        expiresAt: isBankTransfer ? this.sepayService.getExpiresAt() : null,
        paidAt: isBankTransfer ? null : new Date(),
      },
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

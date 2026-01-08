import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

describe('PaymentService', () => {
    let service: PaymentService;
    let prismaService: jest.Mocked<PrismaService>;

    // Mock data
    const mockBooking = {
        id: 1,
        fieldId: 1,
        playerId: 1,
        field: { id: 1, name: 'Sân 1' },
        player: { id: 1 },
    };

    const mockPayment = {
        id: 1,
        bookingId: 1,
        amount: 300000,
        method: 'MOMO',
        status: PaymentStatus.PENDING,
        transactionId: null,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        booking: mockBooking,
    };

    beforeEach(async () => {
        const mockPrismaService = {
            booking: {
                findUniqueOrThrow: jest.fn(),
            },
            payment: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ============================================
    // CREATE PAYMENT TESTS
    // ============================================
    describe('create', () => {
        const createPaymentDto = {
            bookingId: 1,
            amount: 300000,
            method: 'MOMO',
        };

        it('should throw error if booking does not exist', async () => {
            (prismaService.booking.findUniqueOrThrow as jest.Mock).mockRejectedValue(
                new NotFoundException('Booking not found'),
            );

            await expect(service.create(createPaymentDto)).rejects.toThrow(NotFoundException);
        });

        it('should create payment successfully for valid booking', async () => {
            (prismaService.booking.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockBooking);
            (prismaService.payment.create as jest.Mock).mockResolvedValue(mockPayment);

            const result = await service.create(createPaymentDto);

            expect(result).toEqual(mockPayment);
            expect(prismaService.payment.create).toHaveBeenCalledWith({
                data: createPaymentDto,
                include: expect.any(Object),
            });
        });

        it('should include booking details in created payment', async () => {
            (prismaService.booking.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockBooking);
            (prismaService.payment.create as jest.Mock).mockResolvedValue(mockPayment);

            const result = await service.create(createPaymentDto);

            expect(result.booking).toBeDefined();
            expect(result.bookingId).toBe(1);
        });
    });

    // ============================================
    // FIND ALL PAYMENTS TESTS
    // ============================================
    describe('findAll', () => {
        it('should return all payments without status filter', async () => {
            (prismaService.payment.findMany as jest.Mock).mockResolvedValue([mockPayment]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(prismaService.payment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: undefined,
                }),
            );
        });

        it('should filter by status when provided', async () => {
            (prismaService.payment.findMany as jest.Mock).mockResolvedValue([mockPayment]);

            await service.findAll(PaymentStatus.PENDING);

            expect(prismaService.payment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: PaymentStatus.PENDING },
                }),
            );
        });

        it('should order by createdAt descending', async () => {
            (prismaService.payment.findMany as jest.Mock).mockResolvedValue([mockPayment]);

            await service.findAll();

            expect(prismaService.payment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                }),
            );
        });
    });

    // ============================================
    // FIND ONE PAYMENT TESTS
    // ============================================
    describe('findOne', () => {
        it('should throw NotFoundException for non-existent payment', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(99999)).rejects.toThrow('Payment with ID 99999 not found');
        });

        it('should return payment when found', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

            const result = await service.findOne(1);

            expect(result).toEqual(mockPayment);
        });
    });

    // ============================================
    // FIND BY BOOKING ID TESTS
    // ============================================
    describe('findByBookingId', () => {
        it('should return payment for booking', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

            const result = await service.findByBookingId(1);

            expect(result).toEqual(mockPayment);
            expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
                where: { bookingId: 1 },
                include: { booking: true },
            });
        });

        it('should return null if no payment for booking', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.findByBookingId(99999);

            expect(result).toBeNull();
        });
    });

    // ============================================
    // UPDATE PAYMENT TESTS
    // ============================================
    describe('update', () => {
        it('should throw NotFoundException for non-existent payment', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.update(99999, { status: PaymentStatus.PAID })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should update payment successfully', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
            (prismaService.payment.update as jest.Mock).mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID,
            });

            const result = await service.update(1, { status: PaymentStatus.PAID });

            expect(result.status).toBe(PaymentStatus.PAID);
        });
    });

    // ============================================
    // CONFIRM PAYMENT TESTS
    // ============================================
    describe('confirmPayment', () => {
        it('should throw NotFoundException for non-existent payment', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.confirmPayment(99999)).rejects.toThrow(NotFoundException);
        });

        it('should update payment status to PAID', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
            (prismaService.payment.update as jest.Mock).mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID,
                paidAt: new Date(),
            });

            const result = await service.confirmPayment(1);

            expect(result.status).toBe(PaymentStatus.PAID);
            expect(result.paidAt).toBeDefined();
        });

        it('should set paidAt timestamp when confirming', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
            (prismaService.payment.update as jest.Mock).mockImplementation(({ data }) => {
                return Promise.resolve({
                    ...mockPayment,
                    ...data,
                });
            });

            const result = await service.confirmPayment(1);

            expect(prismaService.payment.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    status: PaymentStatus.PAID,
                    paidAt: expect.any(Date),
                },
            });
        });
    });

    // ============================================
    // REMOVE PAYMENT TESTS
    // ============================================
    describe('remove', () => {
        it('should throw NotFoundException for non-existent payment', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(99999)).rejects.toThrow(NotFoundException);
        });

        it('should delete payment successfully', async () => {
            (prismaService.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
            (prismaService.payment.delete as jest.Mock).mockResolvedValue(mockPayment);

            const result = await service.remove(1);

            expect(result).toEqual(mockPayment);
            expect(prismaService.payment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });
});

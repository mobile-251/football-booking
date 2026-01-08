import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingService', () => {
    let service: BookingService;
    let prismaService: jest.Mocked<PrismaService>;
    let notificationService: jest.Mocked<NotificationService>;

    // Mock data
    const mockField = {
        id: 1,
        name: 'Sân 1',
        venueId: 1,
        venue: { id: 1, name: 'Venue 1', address: 'Address 1' },
    };

    const mockPlayer = {
        id: 1,
        userId: 1,
        user: {
            id: 1,
            fullName: 'Test User',
            email: 'test@example.com',
            phoneNumber: '0123456789',
        },
    };

    const mockBooking = {
        id: 1,
        bookingCode: 'BM123ABC',
        fieldId: 1,
        playerId: 1,
        customerName: 'Test Customer',
        customerPhone: '0123456789',
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T11:00:00Z'),
        totalPrice: 300000,
        note: 'Test note',
        status: BookingStatus.PENDING,
        field: mockField,
        player: mockPlayer,
        payment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        // Create mock Prisma service
        const mockPrismaService = {
            field: {
                findUniqueOrThrow: jest.fn(),
            },
            player: {
                findUniqueOrThrow: jest.fn(),
            },
            booking: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        // Create mock Notification service
        const mockNotificationService = {
            createBookingNotification: jest.fn().mockResolvedValue({}),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookingService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compile();

        service = module.get<BookingService>(BookingService);
        prismaService = module.get(PrismaService);
        notificationService = module.get(NotificationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ============================================
    // CREATE BOOKING TESTS
    // ============================================
    describe('create', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        futureDate.setHours(10, 0, 0, 0);

        const futureEndDate = new Date(futureDate);
        futureEndDate.setHours(11, 0, 0, 0);

        const validCreateDto: CreateBookingDto = {
            fieldId: 1,
            playerId: 1,
            customerName: 'Test Customer',
            customerPhone: '0123456789',
            startTime: futureDate.toISOString(),
            endTime: futureEndDate.toISOString(),
            totalPrice: 300000,
            note: 'Test note',
        };

        it('should throw BadRequestException when startTime >= endTime', async () => {
            const invalidDto: CreateBookingDto = {
                ...validCreateDto,
                startTime: futureDate.toISOString(),
                endTime: futureDate.toISOString(), // Same as start time
            };

            await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
            await expect(service.create(invalidDto)).rejects.toThrow('Start time must be before end time');
        });

        it('should throw BadRequestException when startTime > endTime', async () => {
            const invalidDto: CreateBookingDto = {
                ...validCreateDto,
                startTime: futureEndDate.toISOString(),
                endTime: futureDate.toISOString(),
            };

            await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
            await expect(service.create(invalidDto)).rejects.toThrow('Start time must be before end time');
        });

        it('should throw BadRequestException for past startTime', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const pastEndDate = new Date(pastDate);
            pastEndDate.setHours(pastDate.getHours() + 1);

            const invalidDto: CreateBookingDto = {
                ...validCreateDto,
                startTime: pastDate.toISOString(),
                endTime: pastEndDate.toISOString(),
            };

            await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
            await expect(service.create(invalidDto)).rejects.toThrow('Cannot book in the past');
        });

        it('should throw NotFoundException for non-existent field', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockRejectedValue(
                new NotFoundException('Field not found'),
            );

            await expect(service.create(validCreateDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException for non-existent player', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockField);
            (prismaService.player.findUniqueOrThrow as jest.Mock).mockRejectedValue(
                new NotFoundException('Player not found'),
            );

            await expect(service.create(validCreateDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException when time slot is already booked', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockField);
            (prismaService.player.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlayer);
            (prismaService.booking.findFirst as jest.Mock).mockResolvedValue({
                id: 99,
                status: BookingStatus.CONFIRMED,
            });

            await expect(service.create(validCreateDto)).rejects.toThrow(ConflictException);
            await expect(service.create(validCreateDto)).rejects.toThrow('already booked');
        });

        it('should create booking successfully with valid data', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockField);
            (prismaService.player.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlayer);
            (prismaService.booking.findFirst as jest.Mock).mockResolvedValue(null); // No conflict
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null); // No collision for booking code
            (prismaService.booking.create as jest.Mock).mockResolvedValue({
                ...mockBooking,
                startTime: new Date(validCreateDto.startTime),
                endTime: new Date(validCreateDto.endTime),
            });

            const result = await service.create(validCreateDto);

            expect(result).toBeDefined();
            expect(result.status).toBe(BookingStatus.PENDING);
            expect(prismaService.booking.create).toHaveBeenCalled();
        });

        it('should generate booking code in correct format (BM + 6 chars)', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockField);
            (prismaService.player.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockPlayer);
            (prismaService.booking.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.booking.create as jest.Mock).mockImplementation((args) => {
                return Promise.resolve({
                    ...mockBooking,
                    bookingCode: args.data.bookingCode,
                });
            });

            const result = await service.create(validCreateDto);

            expect(result.bookingCode).toMatch(/^BM[A-Z0-9]{6}$/);
        });
    });

    // ============================================
    // FIND ONE TESTS
    // ============================================
    describe('findOne', () => {
        it('should throw NotFoundException for non-existent booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(99999)).rejects.toThrow('Booking with ID 99999 not found');
        });

        it('should return booking when found', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

            const result = await service.findOne(1);

            expect(result).toEqual(mockBooking);
            expect(prismaService.booking.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: expect.any(Object),
            });
        });
    });

    // ============================================
    // FIND ALL TESTS
    // ============================================
    describe('findAll', () => {
        it('should return all bookings without filters', async () => {
            (prismaService.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(prismaService.booking.findMany).toHaveBeenCalled();
        });

        it('should filter by playerId', async () => {
            (prismaService.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

            await service.findAll({ playerId: 1 });

            expect(prismaService.booking.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ playerId: 1 }),
                }),
            );
        });

        it('should filter by status', async () => {
            (prismaService.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

            await service.findAll({ status: BookingStatus.PENDING });

            expect(prismaService.booking.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: BookingStatus.PENDING }),
                }),
            );
        });

        it('should filter by venueId', async () => {
            (prismaService.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

            await service.findAll({ venueId: 1 });

            expect(prismaService.booking.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ field: { venueId: 1 } }),
                }),
            );
        });
    });

    // ============================================
    // CONFIRM BOOKING TESTS
    // ============================================
    describe('confirmBooking', () => {
        it('should throw NotFoundException for non-existent booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.confirmBooking(99999)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for non-PENDING booking', async () => {
            const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(confirmedBooking);

            await expect(service.confirmBooking(1)).rejects.toThrow(BadRequestException);
            await expect(service.confirmBooking(1)).rejects.toThrow('Only PENDING bookings can be confirmed');
        });

        it('should confirm PENDING booking successfully', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
            (prismaService.booking.update as jest.Mock).mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CONFIRMED,
            });

            const result = await service.confirmBooking(1);

            expect(result.status).toBe(BookingStatus.CONFIRMED);
            expect(prismaService.booking.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { status: BookingStatus.CONFIRMED },
            });
        });
    });

    // ============================================
    // CANCEL BOOKING TESTS
    // ============================================
    describe('cancelBooking', () => {
        it('should throw NotFoundException for non-existent booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.cancelBooking(99999)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for CONFIRMED booking', async () => {
            const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(confirmedBooking);

            await expect(service.cancelBooking(1)).rejects.toThrow(BadRequestException);
            await expect(service.cancelBooking(1)).rejects.toThrow('Cannot cancel a confirmed booking');
        });

        it('should throw BadRequestException for already CANCELLED booking', async () => {
            const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(cancelledBooking);

            await expect(service.cancelBooking(1)).rejects.toThrow(BadRequestException);
            await expect(service.cancelBooking(1)).rejects.toThrow('Only PENDING bookings can be cancelled');
        });

        it('should cancel PENDING booking successfully', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
            (prismaService.booking.update as jest.Mock).mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CANCELLED,
            });

            const result = await service.cancelBooking(1);

            expect(result.status).toBe(BookingStatus.CANCELLED);
            expect(notificationService.createBookingNotification).toHaveBeenCalledWith(
                mockPlayer.user.id,
                'cancelled',
                expect.any(Object),
            );
        });
    });

    // ============================================
    // COMPLETE BOOKING TESTS
    // ============================================
    describe('completeBooking', () => {
        it('should throw NotFoundException for non-existent booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.completeBooking(99999, { bookingCode: 'INVALID' })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException for invalid booking code', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CONFIRMED,
            });

            await expect(service.completeBooking(1, { bookingCode: 'WRONGCODE' })).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.completeBooking(1, { bookingCode: 'WRONGCODE' })).rejects.toThrow(
                'Invalid booking code',
            );
        });

        it('should throw BadRequestException for non-CONFIRMED booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking); // PENDING status

            await expect(
                service.completeBooking(1, { bookingCode: mockBooking.bookingCode }),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.completeBooking(1, { bookingCode: mockBooking.bookingCode }),
            ).rejects.toThrow('Only CONFIRMED bookings can be completed');
        });

        it('should complete CONFIRMED booking with valid code', async () => {
            const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(confirmedBooking);
            (prismaService.booking.update as jest.Mock).mockResolvedValue({
                ...confirmedBooking,
                status: BookingStatus.COMPLETED,
            });

            const result = await service.completeBooking(1, { bookingCode: mockBooking.bookingCode });

            expect(result.status).toBe(BookingStatus.COMPLETED);
            expect(prismaService.booking.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { status: BookingStatus.COMPLETED },
                include: expect.any(Object),
            });
        });
    });

    // ============================================
    // UPDATE BOOKING TESTS
    // ============================================
    describe('update', () => {
        it('should throw NotFoundException for non-existent booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.update(99999, { note: 'New note' })).rejects.toThrow(NotFoundException);
        });

        it('should update booking successfully', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
            (prismaService.booking.update as jest.Mock).mockResolvedValue({
                ...mockBooking,
                note: 'Updated note',
            });

            const result = await service.update(1, { note: 'Updated note' });

            expect(result.note).toBe('Updated note');
        });
    });

    // ============================================
    // REMOVE BOOKING TESTS
    // ============================================
    describe('remove', () => {
        it('should throw NotFoundException for non-existent booking', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(99999)).rejects.toThrow(NotFoundException);
        });

        it('should delete booking successfully', async () => {
            (prismaService.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
            (prismaService.booking.delete as jest.Mock).mockResolvedValue(mockBooking);

            const result = await service.remove(1);

            expect(result).toEqual(mockBooking);
            expect(prismaService.booking.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });

    // ============================================
    // GET FIELD AVAILABILITY TESTS
    // ============================================
    describe('getFieldAvailability', () => {
        it('should return bookings for the specified date', async () => {
            const date = '2026-01-15';
            (prismaService.booking.findMany as jest.Mock).mockResolvedValue([
                {
                    startTime: new Date('2026-01-15T10:00:00Z'),
                    endTime: new Date('2026-01-15T11:00:00Z'),
                    status: BookingStatus.CONFIRMED,
                },
            ]);

            const result = await service.getFieldAvailability(1, date);

            expect(result).toHaveLength(1);
            expect(prismaService.booking.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        fieldId: 1,
                        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
                    }),
                }),
            );
        });

        it('should return empty array if no bookings', async () => {
            (prismaService.booking.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getFieldAvailability(1, '2026-01-20');

            expect(result).toHaveLength(0);
        });
    });
});

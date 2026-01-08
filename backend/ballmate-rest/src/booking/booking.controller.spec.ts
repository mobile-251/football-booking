import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingStatus } from '@prisma/client';

describe('BookingController', () => {
    let controller: BookingController;
    let bookingService: jest.Mocked<BookingService>;

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
        status: BookingStatus.PENDING,
    };

    const mockBookingService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        confirmBooking: jest.fn(),
        cancelBooking: jest.fn(),
        completeBooking: jest.fn(),
        remove: jest.fn(),
        getFieldAvailability: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BookingController],
            providers: [{ provide: BookingService, useValue: mockBookingService }],
        }).compile();

        controller = module.get<BookingController>(BookingController);
        bookingService = module.get(BookingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a booking', async () => {
            const createDto = {
                fieldId: 1,
                playerId: 1,
                customerName: 'Test',
                customerPhone: '0123456789',
                startTime: '2026-01-15T10:00:00Z',
                endTime: '2026-01-15T11:00:00Z',
                totalPrice: 300000,
            };
            mockBookingService.create.mockResolvedValue(mockBooking);

            const result = await controller.create(createDto);

            expect(result).toEqual(mockBooking);
            expect(bookingService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return all bookings without filters', async () => {
            mockBookingService.findAll.mockResolvedValue([mockBooking]);

            const result = await controller.findAll();

            expect(result).toEqual([mockBooking]);
            expect(bookingService.findAll).toHaveBeenCalledWith({
                playerId: undefined,
                fieldId: undefined,
                venueId: undefined,
                status: undefined,
            });
        });

        it('should filter by playerId', async () => {
            mockBookingService.findAll.mockResolvedValue([mockBooking]);

            await controller.findAll('1');

            expect(bookingService.findAll).toHaveBeenCalledWith({
                playerId: 1,
                fieldId: undefined,
                venueId: undefined,
                status: undefined,
            });
        });

        it('should filter by status', async () => {
            mockBookingService.findAll.mockResolvedValue([mockBooking]);

            await controller.findAll(undefined, undefined, undefined, BookingStatus.PENDING);

            expect(bookingService.findAll).toHaveBeenCalledWith({
                playerId: undefined,
                fieldId: undefined,
                venueId: undefined,
                status: BookingStatus.PENDING,
            });
        });
    });

    describe('getFieldAvailability', () => {
        it('should return field availability for date', async () => {
            const availability = [{ startTime: new Date(), endTime: new Date() }];
            mockBookingService.getFieldAvailability.mockResolvedValue(availability);

            const result = await controller.getFieldAvailability(1, '2026-01-15');

            expect(result).toEqual(availability);
            expect(bookingService.getFieldAvailability).toHaveBeenCalledWith(1, '2026-01-15');
        });
    });

    describe('findOne', () => {
        it('should return a booking by id', async () => {
            mockBookingService.findOne.mockResolvedValue(mockBooking);

            const result = await controller.findOne(1);

            expect(result).toEqual(mockBooking);
            expect(bookingService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update a booking', async () => {
            const updateDto = { note: 'Updated note' };
            mockBookingService.update.mockResolvedValue({ ...mockBooking, note: 'Updated note' });

            const result = await controller.update(1, updateDto);

            expect(result.note).toBe('Updated note');
            expect(bookingService.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('confirmBooking', () => {
        it('should confirm a booking', async () => {
            mockBookingService.confirmBooking.mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CONFIRMED,
            });

            const result = await controller.confirmBooking(1);

            expect(result.status).toBe(BookingStatus.CONFIRMED);
            expect(bookingService.confirmBooking).toHaveBeenCalledWith(1);
        });
    });

    describe('cancelBooking', () => {
        it('should cancel a booking', async () => {
            mockBookingService.cancelBooking.mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.CANCELLED,
            });

            const result = await controller.cancelBooking(1);

            expect(result.status).toBe(BookingStatus.CANCELLED);
            expect(bookingService.cancelBooking).toHaveBeenCalledWith(1);
        });
    });

    describe('completeBooking', () => {
        it('should complete a booking with valid code', async () => {
            const completeDto = { bookingCode: 'BM123ABC' };
            mockBookingService.completeBooking.mockResolvedValue({
                ...mockBooking,
                status: BookingStatus.COMPLETED,
            });

            const result = await controller.completeBooking(1, completeDto);

            expect(result.status).toBe(BookingStatus.COMPLETED);
            expect(bookingService.completeBooking).toHaveBeenCalledWith(1, completeDto);
        });
    });

    describe('remove', () => {
        it('should remove a booking', async () => {
            mockBookingService.remove.mockResolvedValue(mockBooking);

            const result = await controller.remove(1);

            expect(result).toEqual(mockBooking);
            expect(bookingService.remove).toHaveBeenCalledWith(1);
        });
    });
});

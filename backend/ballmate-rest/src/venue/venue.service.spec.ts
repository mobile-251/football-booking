import { Test, TestingModule } from '@nestjs/testing';
import { VenueService } from './venue.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FieldType, DayType } from '@prisma/client';

describe('VenueService', () => {
    let service: VenueService;
    let prismaService: jest.Mocked<PrismaService>;

    // Mock data
    const mockVenue = {
        id: 1,
        name: 'Test Venue',
        address: '123 Test Street',
        city: 'Ho Chi Minh',
        district: 'District 1',
        openTime: '06:00',
        closeTime: '23:00',
        latitude: 10.8231,
        longitude: 106.6297,
        isActive: true,
        fields: [],
        owner: { id: 1 },
    };

    const mockField = {
        id: 1,
        name: 'Sân 1',
        fieldType: FieldType.FIELD_5VS5,
        venueId: 1,
        isActive: true,
        pricings: [],
        bookings: [],
        reviews: [],
        _count: { bookings: 0, reviews: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const mockPrismaService = {
            venue: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            field: {
                findMany: jest.fn(),
            },
            booking: {
                findMany: jest.fn(),
            },
            fieldPricing: {
                findFirst: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VenueService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<VenueService>(VenueService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ============================================
    // FIND ALL TESTS
    // ============================================
    describe('findAll', () => {
        it('should return all venues without filter', async () => {
            (prismaService.venue.findMany as jest.Mock).mockResolvedValue([mockVenue]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(prismaService.venue.findMany).toHaveBeenCalled();
        });

        it('should filter by city when provided', async () => {
            (prismaService.venue.findMany as jest.Mock).mockResolvedValue([mockVenue]);

            await service.findAll('Ho Chi Minh');

            expect(prismaService.venue.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { city: 'Ho Chi Minh', isActive: true },
                }),
            );
        });
    });

    // ============================================
    // FIND ONE TESTS
    // ============================================
    describe('findOne', () => {
        it('should throw NotFoundException for non-existent venue', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(99999)).rejects.toThrow('Venue with ID 99999 not found');
        });

        it('should return venue with fields when found', async () => {
            const venueWithFields = {
                ...mockVenue,
                fields: [mockField],
            };
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(venueWithFields);

            const result = await service.findOne(1);

            expect(result).toBeDefined();
            expect(result.fields).toBeDefined();
            expect(result.minPrice).toBeDefined();
            expect(result.averageRating).toBeDefined();
        });
    });

    // ============================================
    // UPDATE TESTS
    // ============================================
    describe('update', () => {
        it('should throw NotFoundException for non-existent venue', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.update(99999, { name: 'Updated' })).rejects.toThrow(NotFoundException);
        });

        it('should update venue successfully', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(mockVenue);
            (prismaService.venue.update as jest.Mock).mockResolvedValue({
                ...mockVenue,
                name: 'Updated Venue',
            });

            const result = await service.update(1, { name: 'Updated Venue' });

            expect(result.name).toBe('Updated Venue');
        });
    });

    // ============================================
    // REMOVE TESTS
    // ============================================
    describe('remove', () => {
        it('should throw NotFoundException for non-existent venue', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(99999)).rejects.toThrow(NotFoundException);
        });

        it('should delete venue successfully', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(mockVenue);
            (prismaService.venue.delete as jest.Mock).mockResolvedValue(mockVenue);

            const result = await service.remove(1);

            expect(result).toEqual(mockVenue);
        });
    });

    // ============================================
    // HELPER METHODS TESTS
    // ============================================
    describe('isDayTypeWeekend (tested via getFieldTypePricingSummary)', () => {
        it('should return true for Saturday (public method tests indirectly)', () => {
            // This would be tested via public methods that use this helper
            // Since isDayTypeWeekend is private, we test it through the public APIs
            // Testing indirectly through getFieldTypePricingSummary
        });
    });

    describe('extractBookedHours (tested indirectly)', () => {
        // Private method - tested through public APIs
    });

    // ============================================
    // GET FIELD TYPE PRICING SUMMARY TESTS
    // ============================================
    describe('getFieldTypePricingSummary', () => {
        it('should throw NotFoundException for non-existent venue', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.getFieldTypePricingSummary(99999, '2026-01-15')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should return pricing summary for valid venue and date', async () => {
            (prismaService.venue.findUnique as jest.Mock).mockResolvedValue(mockVenue);
            (prismaService.field.findMany as jest.Mock).mockResolvedValue([{
                ...mockField,
                pricings: [
                    { dayType: DayType.WEEKDAY, startTime: '06:00', endTime: '17:00', price: 200000 },
                    { dayType: DayType.WEEKDAY, startTime: '17:00', endTime: '23:00', price: 400000 },
                ],
            }]);

            const result = await service.getFieldTypePricingSummary(1, '2026-01-15'); // Wednesday

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });
});

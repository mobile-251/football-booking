import { Test, TestingModule } from '@nestjs/testing';
import { FieldService } from './field.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FieldType } from '@prisma/client';

describe('FieldService', () => {
    let service: FieldService;
    let prismaService: jest.Mocked<PrismaService>;

    // Mock data
    const mockVenue = {
        id: 1,
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Ho Chi Minh',
        openTime: '06:00',
        closeTime: '23:00',
    };

    const mockField = {
        id: 1,
        name: 'Sân 1',
        fieldType: FieldType.FIELD_5VS5,
        pricePerHour: 300000,
        venueId: 1,
        images: [],
        isActive: true,
        venue: mockVenue,
        reviews: [],
        _count: { reviews: 0, bookings: 5 },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const mockPrismaService = {
            field: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FieldService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<FieldService>(FieldService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ============================================
    // CREATE FIELD TESTS
    // ============================================
    describe('create', () => {
        const createFieldDto = {
            name: 'New Field',
            fieldType: FieldType.FIELD_7VS7,
            pricePerHour: 400000,
            venueId: 1,
        };

        it('should create field successfully', async () => {
            (prismaService.field.create as jest.Mock).mockResolvedValue({
                ...mockField,
                ...createFieldDto,
            });

            const result = await service.create(createFieldDto);

            expect(result.name).toBe(createFieldDto.name);
            expect(prismaService.field.create).toHaveBeenCalledWith({
                data: createFieldDto,
                include: expect.any(Object),
            });
        });
    });

    // ============================================
    // FIND ALL TESTS
    // ============================================
    describe('findAll', () => {
        it('should return all active fields without filters', async () => {
            (prismaService.field.findMany as jest.Mock).mockResolvedValue([mockField]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(prismaService.field.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isActive: true }),
                }),
            );
        });

        it('should filter by city', async () => {
            (prismaService.field.findMany as jest.Mock).mockResolvedValue([mockField]);

            await service.findAll({ city: 'Ho Chi Minh' });

            expect(prismaService.field.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        venue: { city: 'Ho Chi Minh' },
                    }),
                }),
            );
        });

        it('should filter by fieldType', async () => {
            (prismaService.field.findMany as jest.Mock).mockResolvedValue([mockField]);

            await service.findAll({ fieldType: FieldType.FIELD_5VS5 });

            expect(prismaService.field.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        fieldType: FieldType.FIELD_5VS5,
                    }),
                }),
            );
        });

        it('should filter by maxPrice', async () => {
            (prismaService.field.findMany as jest.Mock).mockResolvedValue([mockField]);

            await service.findAll({ maxPrice: 400000 });

            expect(prismaService.field.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        pricePerHour: { lte: 400000 },
                    }),
                }),
            );
        });
    });

    // ============================================
    // FIND ONE TESTS
    // ============================================
    describe('findOne', () => {
        it('should throw NotFoundException for non-existent field', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(99999)).rejects.toThrow('Field with ID 99999 not found');
        });

        it('should return field with average rating', async () => {
            const fieldWithReviews = {
                ...mockField,
                reviews: [{ rating: 4 }, { rating: 5 }],
            };
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(fieldWithReviews);

            const result = await service.findOne(1);

            expect(result).toHaveProperty('averageRating');
            expect(result.averageRating).toBe(4.5);
        });

        it('should return 0 average rating for field with no reviews', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(mockField);

            const result = await service.findOne(1);

            expect(result.averageRating).toBe(0);
        });
    });

    // ============================================
    // UPDATE TESTS
    // ============================================
    describe('update', () => {
        it('should throw NotFoundException for non-existent field', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.update(99999, { name: 'Updated' })).rejects.toThrow(NotFoundException);
        });

        it('should update field successfully', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(mockField);
            (prismaService.field.update as jest.Mock).mockResolvedValue({
                ...mockField,
                name: 'Updated Field',
            });

            const result = await service.update(1, { name: 'Updated Field' });

            expect(result.name).toBe('Updated Field');
        });
    });

    // ============================================
    // REMOVE TESTS
    // ============================================
    describe('remove', () => {
        it('should throw NotFoundException for non-existent field', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(99999)).rejects.toThrow(NotFoundException);
        });

        it('should delete field successfully', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(mockField);
            (prismaService.field.delete as jest.Mock).mockResolvedValue(mockField);

            const result = await service.remove(1);

            expect(result).toEqual(mockField);
        });
    });

    // ============================================
    // GET STATS TESTS
    // ============================================
    describe('getStats', () => {
        it('should return field statistics by type', async () => {
            (prismaService.field.count as jest.Mock)
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(5)  // FIELD_5VS5
                .mockResolvedValueOnce(3)  // FIELD_7VS7
                .mockResolvedValueOnce(2); // FIELD_11VS11

            const result = await service.getStats();

            expect(result).toEqual({
                total: 10,
                byType: {
                    FIELD_5VS5: 5,
                    FIELD_7VS7: 3,
                    FIELD_11VS11: 2,
                },
            });
        });
    });

    // ============================================
    // GET FIELD PRICING TESTS
    // ============================================
    describe('getFieldPricing', () => {
        it('should throw NotFoundException for non-existent field', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.getFieldPricing(99999, '2026-01-15')).rejects.toThrow(NotFoundException);
        });

        it('should return WEEKDAY pricing for weekdays', async () => {
            const fieldWithPricing = {
                ...mockField,
                venue: { ...mockVenue, openTime: '06:00', closeTime: '23:00' },
                pricings: [
                    { dayType: 'WEEKDAY', startTime: '06:00', endTime: '17:00', price: 200000 },
                    { dayType: 'WEEKDAY', startTime: '17:00', endTime: '23:00', price: 400000 },
                ],
            };
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(fieldWithPricing);

            const result = await service.getFieldPricing(1, '2026-01-15'); // Thursday

            expect(result.dayType).toBe('WEEKDAY');
            expect(result.fieldId).toBe(1);
            expect(result.slots).toBeDefined();
            expect(Array.isArray(result.slots)).toBe(true);
        });

        it('should return WEEKEND pricing for Saturday', async () => {
            const fieldWithPricing = {
                ...mockField,
                venue: { ...mockVenue, openTime: '06:00', closeTime: '23:00' },
                pricings: [
                    { dayType: 'WEEKEND', startTime: '06:00', endTime: '23:00', price: 350000 },
                ],
            };
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(fieldWithPricing);

            const result = await service.getFieldPricing(1, '2026-01-17'); // Saturday

            expect(result.dayType).toBe('WEEKEND');
        });

        it('should return WEEKEND pricing for Sunday', async () => {
            const fieldWithPricing = {
                ...mockField,
                venue: { ...mockVenue, openTime: '06:00', closeTime: '23:00' },
                pricings: [],
            };
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(fieldWithPricing);

            const result = await service.getFieldPricing(1, '2026-01-18'); // Sunday

            expect(result.dayType).toBe('WEEKEND');
        });

        it('should mark peak hours correctly (17:00-21:00)', async () => {
            const fieldWithPricing = {
                ...mockField,
                venue: { ...mockVenue, openTime: '06:00', closeTime: '23:00' },
                pricings: [],
            };
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(fieldWithPricing);

            const result = await service.getFieldPricing(1, '2026-01-15');

            const peakSlots = result.slots.filter((s: any) => s.isPeakHour);
            const nonPeakSlots = result.slots.filter((s: any) => !s.isPeakHour);

            // Peak hours: 17:00, 18:00, 19:00, 20:00
            expect(peakSlots.length).toBe(4);
            expect(peakSlots[0].startTime).toBe('17:00');
            expect(nonPeakSlots.length).toBeGreaterThan(0);
        });

        it('should use default prices when no pricing configured', async () => {
            const fieldWithNoPricing = {
                ...mockField,
                venue: { ...mockVenue, openTime: '06:00', closeTime: '23:00' },
                pricings: [],
            };
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue(fieldWithNoPricing);

            const result = await service.getFieldPricing(1, '2026-01-15');

            // Should have default prices: 500000 for peak, 300000 for non-peak
            const peakSlot = result.slots.find((s: any) => s.isPeakHour);
            const nonPeakSlot = result.slots.find((s: any) => !s.isPeakHour);

            expect(peakSlot?.price).toBe(500000);
            expect(nonPeakSlot?.price).toBe(300000);
        });
    });
});

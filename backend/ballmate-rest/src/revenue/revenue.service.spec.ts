import { Test, TestingModule } from '@nestjs/testing';
import { RevenueService } from './revenue.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRevenueReportDto } from './dto/create-revenue.dto';

describe('RevenueService', () => {
    let service: RevenueService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockRevenueReport = {
        id: 1,
        venueId: 1,
        fieldId: 1,
        totalRevenue: 5000000,
        totalBookings: 15,
        reportDate: new Date('2026-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const mockPrismaService = {
            revenueReport: {
                create: jest.fn(),
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RevenueService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<RevenueService>(RevenueService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a revenue report', async () => {
            const createDto: CreateRevenueReportDto = {
                venueId: 1,
                fieldId: 1,
                totalRevenue: 5000000,
                totalBookings: 15,
                reportDate: '2026-01-15',
            };
            (prismaService.revenueReport.create as jest.Mock).mockResolvedValue(mockRevenueReport);

            const result = await service.create(createDto);

            expect(result).toEqual(mockRevenueReport);
            expect(prismaService.revenueReport.create).toHaveBeenCalledWith({
                data: {
                    ...createDto,
                    reportDate: expect.any(Date),
                },
            });
        });
    });

    describe('findAll', () => {
        it('should return all reports without filters', async () => {
            (prismaService.revenueReport.findMany as jest.Mock).mockResolvedValue([mockRevenueReport]);

            const result = await service.findAll();

            expect(result).toEqual([mockRevenueReport]);
            expect(prismaService.revenueReport.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} }),
            );
        });

        it('should filter by venueId and fieldId', async () => {
            (prismaService.revenueReport.findMany as jest.Mock).mockResolvedValue([mockRevenueReport]);

            await service.findAll(1, 1);

            expect(prismaService.revenueReport.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { venueId: 1, fieldId: 1 } }),
            );
        });
    });

    describe('getVenueRevenue', () => {
        it('should return aggregated venue revenue', async () => {
            (prismaService.revenueReport.findMany as jest.Mock).mockResolvedValue([
                { ...mockRevenueReport, totalRevenue: 1000000, totalBookings: 5 },
                { ...mockRevenueReport, totalRevenue: 2000000, totalBookings: 10 },
            ]);

            const result = await service.getVenueRevenue(1, '2026-01-01', '2026-01-31');

            expect(result.totalRevenue).toBe(3000000);
            expect(result.totalBookings).toBe(15);
            expect(result.reports).toHaveLength(2);
            expect(prismaService.revenueReport.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        venueId: 1,
                        reportDate: expect.any(Object),
                    }),
                }),
            );
        });
    });

    describe('getFieldRevenue', () => {
        it('should return aggregated field revenue', async () => {
            (prismaService.revenueReport.findMany as jest.Mock).mockResolvedValue([
                { ...mockRevenueReport, totalRevenue: 500000, totalBookings: 2 },
            ]);

            const result = await service.getFieldRevenue(1);

            expect(result.totalRevenue).toBe(500000);
            expect(result.totalBookings).toBe(2);
            expect(prismaService.revenueReport.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { fieldId: 1 } }),
            );
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';

describe('RevenueController', () => {
    let controller: RevenueController;
    let revenueService: jest.Mocked<RevenueService>;

    const mockRevenueReport = {
        id: 1,
        venueId: 1,
        fieldId: 1,
        totalRevenue: 5000000,
        totalBookings: 15,
        reportDate: new Date('2026-01-15'),
    };

    const mockRevenueService = {
        create: jest.fn(),
        findAll: jest.fn(),
        getVenueRevenue: jest.fn(),
        getFieldRevenue: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RevenueController],
            providers: [{ provide: RevenueService, useValue: mockRevenueService }],
        }).compile();

        controller = module.get<RevenueController>(RevenueController);
        revenueService = module.get(RevenueService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create revenue report', async () => {
            const dto = {
                venueId: 1,
                fieldId: 1,
                totalRevenue: 5000000,
                totalBookings: 15,
                reportDate: '2026-01-15',
            };
            mockRevenueService.create.mockResolvedValue(mockRevenueReport);

            const result = await controller.create(dto);

            expect(result).toEqual(mockRevenueReport);
            expect(revenueService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return all reports', async () => {
            mockRevenueService.findAll.mockResolvedValue([mockRevenueReport]);

            const result = await controller.findAll();

            expect(result).toEqual([mockRevenueReport]);
            expect(revenueService.findAll).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should filter by venueId and fieldId', async () => {
            mockRevenueService.findAll.mockResolvedValue([mockRevenueReport]);

            await controller.findAll('1', '1');

            expect(revenueService.findAll).toHaveBeenCalledWith(1, 1);
        });
    });

    describe('getVenueRevenue', () => {
        it('should return venue revenue', async () => {
            const response = { venueId: 1, totalRevenue: 100, totalBookings: 1, reports: [] };
            mockRevenueService.getVenueRevenue.mockResolvedValue(response);

            const result = await controller.getVenueRevenue(1, '2026-01-01', '2026-01-31');

            expect(result).toEqual(response);
            expect(revenueService.getVenueRevenue).toHaveBeenCalledWith(1, '2026-01-01', '2026-01-31');
        });
    });

    describe('getFieldRevenue', () => {
        it('should return field revenue', async () => {
            const response = { fieldId: 1, totalRevenue: 100, totalBookings: 1, reports: [] };
            mockRevenueService.getFieldRevenue.mockResolvedValue(response);

            const result = await controller.getFieldRevenue(1, '2026-01-01', '2026-01-31');

            expect(result).toEqual(response);
            expect(revenueService.getFieldRevenue).toHaveBeenCalledWith(1, '2026-01-01', '2026-01-31');
        });
    });
});

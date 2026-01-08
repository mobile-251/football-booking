import { Test, TestingModule } from '@nestjs/testing';
import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';

describe('VenueController', () => {
    let controller: VenueController;
    let venueService: jest.Mocked<VenueService>;

    const mockVenue = {
        id: 1,
        name: 'Test Venue',
        address: '123 Test Street',
        city: 'Ho Chi Minh',
        district: 'District 1',
        openTime: '06:00',
        closeTime: '23:00',
        isActive: true,
        fields: [],
    };

    const mockVenueService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        getFieldTypePricingSummary: jest.fn(),
        getFieldTypeSlots: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [VenueController],
            providers: [{ provide: VenueService, useValue: mockVenueService }],
        }).compile();

        controller = module.get<VenueController>(VenueController);
        venueService = module.get(VenueService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a venue', async () => {
            const createDto = {
                name: 'Test Venue',
                address: '123 Test St',
                city: 'Ho Chi Minh',
                district: 'District 1',
                ownerId: 1,
                fieldTypes: {},
                pricing: {},
                phoneNumber: '0123456789',
            };
            mockVenueService.create.mockResolvedValue(mockVenue);

            const result = await controller.create(createDto as any);

            expect(result).toEqual(mockVenue);
            expect(venueService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return all venues without filter', async () => {
            mockVenueService.findAll.mockResolvedValue([mockVenue]);

            const result = await controller.findAll();

            expect(result).toEqual([mockVenue]);
            expect(venueService.findAll).toHaveBeenCalledWith(undefined);
        });

        it('should filter by city', async () => {
            mockVenueService.findAll.mockResolvedValue([mockVenue]);

            await controller.findAll('Ho Chi Minh');

            expect(venueService.findAll).toHaveBeenCalledWith('Ho Chi Minh');
        });
    });

    describe('findOne', () => {
        it('should return venue by id', async () => {
            mockVenueService.findOne.mockResolvedValue(mockVenue);

            const result = await controller.findOne(1);

            expect(result).toEqual(mockVenue);
            expect(venueService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update venue', async () => {
            const updateDto = { name: 'Updated Venue' };
            mockVenueService.update.mockResolvedValue({ ...mockVenue, name: 'Updated Venue' });

            const result = await controller.update(1, updateDto);

            expect(result.name).toBe('Updated Venue');
            expect(venueService.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('getFieldTypePricingSummary', () => {
        it('should return pricing summary for date', async () => {
            const summary = [{ fieldType: 'FIELD_5VS5', minPrice: 200000 }];
            mockVenueService.getFieldTypePricingSummary.mockResolvedValue(summary);

            const result = await controller.getFieldTypePricingSummary(1, '2026-01-15');

            expect(result).toEqual(summary);
            expect(venueService.getFieldTypePricingSummary).toHaveBeenCalledWith(1, '2026-01-15');
        });
    });

    describe('getFieldTypeSlots', () => {
        it('should return field slots for type and date', async () => {
            const slots = [{ fieldId: 1, fieldName: 'Field 1', slots: [] }];
            mockVenueService.getFieldTypeSlots.mockResolvedValue(slots);

            const result = await controller.getFieldTypeSlots(1, 'FIELD_5VS5', '2026-01-15');

            expect(result).toEqual(slots);
            expect(venueService.getFieldTypeSlots).toHaveBeenCalledWith(1, 'FIELD_5VS5', '2026-01-15');
        });
    });

    describe('remove', () => {
        it('should remove venue', async () => {
            mockVenueService.remove.mockResolvedValue(mockVenue);

            const result = await controller.remove(1);

            expect(result).toEqual(mockVenue);
            expect(venueService.remove).toHaveBeenCalledWith(1);
        });
    });
});

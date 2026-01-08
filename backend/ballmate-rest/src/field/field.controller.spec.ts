import { Test, TestingModule } from '@nestjs/testing';
import { FieldController } from './field.controller';
import { FieldService } from './field.service';
import { FieldType } from '@prisma/client';

describe('FieldController', () => {
    let controller: FieldController;
    let fieldService: jest.Mocked<FieldService>;

    const mockField = {
        id: 1,
        name: 'Sân 1',
        fieldType: FieldType.FIELD_5VS5,
        venueId: 1,
        isActive: true,
        venue: { id: 1, name: 'Test Venue' },
    };

    const mockFieldService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        getStats: jest.fn(),
        getFieldPricing: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FieldController],
            providers: [{ provide: FieldService, useValue: mockFieldService }],
        }).compile();

        controller = module.get<FieldController>(FieldController);
        fieldService = module.get(FieldService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a field', async () => {
            const createDto = {
                name: 'New Field',
                fieldType: FieldType.FIELD_7VS7,
                venueId: 1,
            };
            mockFieldService.create.mockResolvedValue({ ...mockField, ...createDto });

            const result = await controller.create(createDto as any);

            expect(result.name).toBe('New Field');
            expect(fieldService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('getStats', () => {
        it('should return field statistics', async () => {
            const stats = { total: 10, byType: { FIELD_5VS5: 5, FIELD_7VS7: 3, FIELD_11VS11: 2 } };
            mockFieldService.getStats.mockResolvedValue(stats);

            const result = await controller.getStats();

            expect(result).toEqual(stats);
            expect(fieldService.getStats).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all fields without filters', async () => {
            mockFieldService.findAll.mockResolvedValue([mockField]);

            const result = await controller.findAll();

            expect(result).toEqual([mockField]);
            expect(fieldService.findAll).toHaveBeenCalledWith({
                city: undefined,
                fieldType: undefined,
                maxPrice: undefined,
            });
        });

        it('should filter by city', async () => {
            mockFieldService.findAll.mockResolvedValue([mockField]);

            await controller.findAll('Ho Chi Minh');

            expect(fieldService.findAll).toHaveBeenCalledWith({
                city: 'Ho Chi Minh',
                fieldType: undefined,
                maxPrice: undefined,
            });
        });

        it('should filter by fieldType', async () => {
            mockFieldService.findAll.mockResolvedValue([mockField]);

            await controller.findAll(undefined, FieldType.FIELD_5VS5);

            expect(fieldService.findAll).toHaveBeenCalledWith({
                city: undefined,
                fieldType: FieldType.FIELD_5VS5,
                maxPrice: undefined,
            });
        });

        it('should filter by maxPrice', async () => {
            mockFieldService.findAll.mockResolvedValue([mockField]);

            await controller.findAll(undefined, undefined, '400000');

            expect(fieldService.findAll).toHaveBeenCalledWith({
                city: undefined,
                fieldType: undefined,
                maxPrice: 400000,
            });
        });
    });

    describe('getFieldPricing', () => {
        it('should return pricing for field on date', async () => {
            const pricing = { fieldId: 1, dayType: 'WEEKDAY', slots: [] };
            mockFieldService.getFieldPricing.mockResolvedValue(pricing);

            const result = await controller.getFieldPricing(1, '2026-01-15');

            expect(result).toEqual(pricing);
            expect(fieldService.getFieldPricing).toHaveBeenCalledWith(1, '2026-01-15');
        });
    });

    describe('findOne', () => {
        it('should return field by id', async () => {
            mockFieldService.findOne.mockResolvedValue(mockField);

            const result = await controller.findOne(1);

            expect(result).toEqual(mockField);
            expect(fieldService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update field', async () => {
            const updateDto = { name: 'Updated Field' };
            mockFieldService.update.mockResolvedValue({ ...mockField, name: 'Updated Field' });

            const result = await controller.update(1, updateDto);

            expect(result.name).toBe('Updated Field');
            expect(fieldService.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('remove', () => {
        it('should remove field', async () => {
            mockFieldService.remove.mockResolvedValue(mockField);

            const result = await controller.remove(1);

            expect(result).toEqual(mockField);
            expect(fieldService.remove).toHaveBeenCalledWith(1);
        });
    });
});

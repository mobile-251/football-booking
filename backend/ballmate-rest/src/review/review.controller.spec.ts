import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

describe('ReviewController', () => {
    let controller: ReviewController;
    let reviewService: jest.Mocked<ReviewService>;

    const mockReview = {
        id: 1,
        fieldId: 1,
        playerId: 1,
        rating: 5,
        comment: 'Great field!',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockReviewService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReviewController],
            providers: [{ provide: ReviewService, useValue: mockReviewService }],
        }).compile();

        controller = module.get<ReviewController>(ReviewController);
        reviewService = module.get(ReviewService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a review', async () => {
            const createDto = { fieldId: 1, playerId: 1, rating: 5, comment: 'Excellent!' };
            mockReviewService.create.mockResolvedValue({ ...mockReview, ...createDto });

            const result = await controller.create(createDto as any);

            expect(result.rating).toBe(5);
            expect(reviewService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return all reviews without filter', async () => {
            mockReviewService.findAll.mockResolvedValue([mockReview]);

            const result = await controller.findAll();

            expect(result).toEqual([mockReview]);
            expect(reviewService.findAll).toHaveBeenCalledWith(undefined);
        });

        it('should filter by fieldId', async () => {
            mockReviewService.findAll.mockResolvedValue([mockReview]);

            await controller.findAll('1');

            expect(reviewService.findAll).toHaveBeenCalledWith(1);
        });
    });

    describe('findOne', () => {
        it('should return review by id', async () => {
            mockReviewService.findOne.mockResolvedValue(mockReview);

            const result = await controller.findOne(1);

            expect(result).toEqual(mockReview);
            expect(reviewService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update review', async () => {
            const updateDto = { rating: 4, comment: 'Updated comment' };
            mockReviewService.update.mockResolvedValue({ ...mockReview, ...updateDto });

            const result = await controller.update(1, updateDto);

            expect(result.rating).toBe(4);
            expect(reviewService.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('remove', () => {
        it('should remove review', async () => {
            mockReviewService.remove.mockResolvedValue(mockReview);

            const result = await controller.remove(1);

            expect(result).toEqual(mockReview);
            expect(reviewService.remove).toHaveBeenCalledWith(1);
        });
    });
});

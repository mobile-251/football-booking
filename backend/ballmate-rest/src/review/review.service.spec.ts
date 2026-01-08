import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ReviewService', () => {
    let service: ReviewService;
    let prismaService: jest.Mocked<PrismaService>;

    // Mock data
    const mockReview = {
        id: 1,
        fieldId: 1,
        playerId: 1,
        rating: 5,
        comment: 'Great field!',
        createdAt: new Date(),
        updatedAt: new Date(),
        field: { id: 1, name: 'Sân 1' },
        player: {
            id: 1,
            user: {
                id: 1,
                fullName: 'Test User',
                email: 'test@example.com',
                phoneNumber: '0123456789',
            },
        },
    };

    beforeEach(async () => {
        const mockPrismaService = {
            field: {
                findUniqueOrThrow: jest.fn(),
            },
            user: {
                findUniqueOrThrow: jest.fn(),
            },
            review: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ReviewService>(ReviewService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ============================================
    // CREATE REVIEW TESTS
    // ============================================
    describe('create', () => {
        const createReviewDto = {
            fieldId: 1,
            playerId: 1,
            rating: 5,
            comment: 'Excellent!',
        };

        it('should throw error if field does not exist', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockRejectedValue(
                new NotFoundException('Field not found'),
            );

            await expect(service.create(createReviewDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw error if player (user) does not exist', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(
                new NotFoundException('User not found'),
            );

            await expect(service.create(createReviewDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if player already reviewed this field', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(mockReview);

            await expect(service.create(createReviewDto)).rejects.toThrow(ConflictException);
            await expect(service.create(createReviewDto)).rejects.toThrow(
                'You have already reviewed this field',
            );
        });

        it('should create review successfully', async () => {
            (prismaService.field.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.review.create as jest.Mock).mockResolvedValue(mockReview);

            const result = await service.create(createReviewDto);

            expect(result).toEqual(mockReview);
            expect(prismaService.review.create).toHaveBeenCalled();
        });
    });

    // ============================================
    // FIND ALL TESTS
    // ============================================
    describe('findAll', () => {
        it('should return all reviews without filter', async () => {
            (prismaService.review.findMany as jest.Mock).mockResolvedValue([mockReview]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(prismaService.review.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: undefined,
                }),
            );
        });

        it('should filter by fieldId when provided', async () => {
            (prismaService.review.findMany as jest.Mock).mockResolvedValue([mockReview]);

            await service.findAll(1);

            expect(prismaService.review.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { fieldId: 1 },
                }),
            );
        });

        it('should order by createdAt descending', async () => {
            (prismaService.review.findMany as jest.Mock).mockResolvedValue([mockReview]);

            await service.findAll();

            expect(prismaService.review.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                }),
            );
        });
    });

    // ============================================
    // FIND ONE TESTS
    // ============================================
    describe('findOne', () => {
        it('should throw NotFoundException for non-existent review', async () => {
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(99999)).rejects.toThrow('Review with ID 99999 not found');
        });

        it('should return review when found', async () => {
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(mockReview);

            const result = await service.findOne(1);

            expect(result).toEqual(mockReview);
        });
    });

    // ============================================
    // UPDATE TESTS
    // ============================================
    describe('update', () => {
        it('should throw NotFoundException for non-existent review', async () => {
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.update(99999, { rating: 4 })).rejects.toThrow(NotFoundException);
        });

        it('should update review successfully', async () => {
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
            (prismaService.review.update as jest.Mock).mockResolvedValue({
                ...mockReview,
                rating: 4,
                comment: 'Updated comment',
            });

            const result = await service.update(1, { rating: 4, comment: 'Updated comment' });

            expect(result.rating).toBe(4);
            expect(result.comment).toBe('Updated comment');
        });
    });

    // ============================================
    // REMOVE TESTS
    // ============================================
    describe('remove', () => {
        it('should throw NotFoundException for non-existent review', async () => {
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(99999)).rejects.toThrow(NotFoundException);
        });

        it('should delete review successfully', async () => {
            (prismaService.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
            (prismaService.review.delete as jest.Mock).mockResolvedValue(mockReview);

            const result = await service.remove(1);

            expect(result).toEqual(mockReview);
            expect(prismaService.review.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });
});

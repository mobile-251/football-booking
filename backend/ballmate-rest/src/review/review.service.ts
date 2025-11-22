import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    // Check if field exists
    await this.prisma.field.findUniqueOrThrow({
      where: { id: createReviewDto.fieldId },
    });

    // Check if player exists
    await this.prisma.user.findUniqueOrThrow({
      where: { id: createReviewDto.playerId },
    });

    // Check if player already reviewed this field
    const existingReview = await this.prisma.review.findUnique({
      where: {
        fieldId_playerId: {
          fieldId: createReviewDto.fieldId,
          playerId: createReviewDto.playerId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this field');
    }

    return this.prisma.review.create({
      data: createReviewDto,
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
        player: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(fieldId?: number) {
    return this.prisma.review.findMany({
      where: fieldId ? { fieldId } : undefined,
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
        player: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        field: true,
        player: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    await this.findOne(id);

    return this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.review.delete({
      where: { id },
    });
  }
}

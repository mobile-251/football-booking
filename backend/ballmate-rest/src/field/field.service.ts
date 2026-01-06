import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FieldType } from '@prisma/client';

@Injectable()
export class FieldService {
  constructor(private prisma: PrismaService) { }

  async create(createFieldDto: CreateFieldDto) {
    return this.prisma.field.create({
      data: createFieldDto,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    city?: string;
    fieldType?: FieldType;
    maxPrice?: number;
  }) {
    return this.prisma.field.findMany({
      where: {
        isActive: true,
        ...(filters?.fieldType && { fieldType: filters.fieldType }),
        ...(filters?.maxPrice && { pricePerHour: { lte: filters.maxPrice } }),
        ...(filters?.city && {
          venue: {
            city: filters.city,
          },
        }),
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            district: true,
            facilities: true,
            openTime: true,
            closeTime: true,
            latitude: true,
            longitude: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const field = await this.prisma.field.findUnique({
      where: { id },
      include: {
        venue: true,
        reviews: {
          include: {
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
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    const avgRating =
      field.reviews.length > 0
        ? field.reviews.reduce((sum, r) => sum + r.rating, 0) /
        field.reviews.length
        : 0;

    return {
      ...field,
      averageRating: parseFloat(avgRating.toFixed(1)),
    };
  }

  async update(id: number, updateFieldDto: UpdateFieldDto) {
    await this.findOne(id);

    return this.prisma.field.update({
      where: { id },
      data: updateFieldDto,
      include: {
        venue: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.field.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, field5, field7, field11, minPrice] = await Promise.all([
      this.prisma.field.count({ where: { isActive: true } }),
      this.prisma.field.count({ where: { isActive: true, fieldType: 'FIELD_5VS5' } }),
      this.prisma.field.count({ where: { isActive: true, fieldType: 'FIELD_7VS7' } }),
      this.prisma.field.count({ where: { isActive: true, fieldType: 'FIELD_11VS11' } }),
      this.prisma.field.findFirst({
        where: { isActive: true },
        orderBy: { pricePerHour: 'asc' },
        select: { pricePerHour: true },
      }),
    ]);

    return {
      total,
      byType: {
        FIELD_5VS5: field5,
        FIELD_7VS7: field7,
        FIELD_11VS11: field11,
      },
      minPrice: minPrice?.pricePerHour || 0,
    };
  }
}

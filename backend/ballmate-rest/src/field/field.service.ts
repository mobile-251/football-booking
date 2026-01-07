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
            // facilities: true,
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
    const [total, field5, field7, field11] = await Promise.all([
      this.prisma.field.count({ where: { isActive: true } }),
      this.prisma.field.count({ where: { isActive: true, fieldType: 'FIELD_5VS5' } }),
      this.prisma.field.count({ where: { isActive: true, fieldType: 'FIELD_7VS7' } }),
      this.prisma.field.count({ where: { isActive: true, fieldType: 'FIELD_11VS11' } }),
    ]);

    return {
      total,
      byType: {
        FIELD_5VS5: field5,
        FIELD_7VS7: field7,
        FIELD_11VS11: field11,
      },
      // minPrice: minPrice?.pricePerHour || 0,
    };
  }

  /**
   * Get field pricing for a specific date
   * Returns hourly slots with prices from FieldPricing table
   */
  async getFieldPricing(fieldId: number, date: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        venue: {
          select: {
            openTime: true,
            closeTime: true,
          },
        },
        pricings: true,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    // Determine if date is weekday or weekend
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    const dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY';

    // Get pricings for the day type
    const pricings = field.pricings.filter(p => p.dayType === dayType);

    // Parse venue hours (default 6:00-23:00 if not set)
    const openHour = field.venue?.openTime ? parseInt(field.venue.openTime.split(':')[0]) : 6;
    const closeHour = field.venue?.closeTime ? parseInt(field.venue.closeTime.split(':')[0]) : 23;

    // Generate hourly slots
    const slots: {
      startTime: string;
      endTime: string;
      price: number;
      isPeakHour: boolean;
    }[] = [];

    for (let hour = openHour; hour < closeHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const isPeakHour = hour >= 17 && hour < 21; // 17:00-21:00 is peak

      // Find matching pricing slot
      let price = 0;
      for (const pricing of pricings) {
        const pStart = parseInt(pricing.startTime.split(':')[0]);
        const pEnd = parseInt(pricing.endTime.split(':')[0]);
        if (hour >= pStart && hour < pEnd) {
          price = pricing.price;
          break;
        }
      }

      // If no pricing found, use default based on peak hour
      if (price === 0) {
        price = isPeakHour ? 500000 : 300000; // Default prices
      }

      slots.push({
        startTime,
        endTime,
        price,
        isPeakHour,
      });
    }

    return {
      fieldId,
      dayType,
      date,
      slots,
    };
  }
}

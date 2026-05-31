import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { FieldType, DayType, Prisma, UserRole } from '@prisma/client';
import { JwtUser } from '../auth/types/jwt-user.type';
import { findPriceForHour, getDayTypeForDate } from '../field/booking-pricing.util';
import {
  parseExclusiveCloseHour,
  parseOpenHour,
} from '../field/venue-hours.util';

const DEFAULT_VENUE_POLICIES = {
  booking:
    'Đặt sân trước ít nhất 2 giờ. Hủy miễn phí trước 4 giờ. Thanh toán tại sân hoặc chuyển khoản.',
  usage:
    'Mang giày đá banh cỏ nhân tạo. Không hút thuốc trong khu vực sân. Giữ gìn vệ sinh chung.',
  insurance:
    'Khách hàng tự bảo đảm an toàn khi thi đấu. Sân không chịu trách nhiệm với tư trang để ngoài khu vực quản lý.',
};

type PricedItem = { name: string; price: number };

function parseVenuePricedItems(raw: Prisma.JsonValue | null): PricedItem[] {
  if (raw === null || raw === undefined || !Array.isArray(raw) || raw.length === 0) {
    return [];
  }
  return raw
    .filter(
      (item): item is PricedItem =>
        typeof item === 'object' &&
        item !== null &&
        'name' in item &&
        typeof (item as PricedItem).name === 'string' &&
        (item as PricedItem).name.trim().length > 0 &&
        'price' in item,
    )
    .map((item) => ({
      name: String((item as PricedItem).name).trim(),
      price: Number((item as PricedItem).price),
    }))
    .filter((item) => Number.isFinite(item.price) && item.price >= 0);
}

function parseVenuePolicies(raw: Prisma.JsonValue | null) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const p = raw as Record<string, string>;
    return {
      booking: p.booking ?? DEFAULT_VENUE_POLICIES.booking,
      usage: p.usage ?? DEFAULT_VENUE_POLICIES.usage,
      insurance: p.insurance ?? DEFAULT_VENUE_POLICIES.insurance,
    };
  }
  return { ...DEFAULT_VENUE_POLICIES };
}

@Injectable()
export class VenueService {
  constructor(private prisma: PrismaService) { }

  async create(createVenueDto: CreateVenueDto) {
    const { fieldTypes, pricing, phoneNumber, ...venueData } = createVenueDto;
    // Verify that ownerId is a valid FieldOwner
    const user = await this.prisma.user.findUnique({
      where: { id: venueData.ownerId },
    });

    const fieldOwner = await this.prisma.fieldOwner.findUnique({
      where: { userId: user?.id },
    });

    if (!fieldOwner) {
      throw new NotFoundException(
        `FieldOwner with ID ${venueData.ownerId} not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: {
          ...venueData,
          ownerId: fieldOwner.id,
          phoneNumber: phoneNumber,
          openTime: venueData.openTime || '06:00',
          closeTime: venueData.closeTime || '23:00',
        },
      });

      // Mapping for field naming and types
      const fieldTypeMap = {
        field5: { type: FieldType.FIELD_5VS5, label: '5' },
        field7: { type: FieldType.FIELD_7VS7, label: '7' },
        field11: { type: FieldType.FIELD_11VS11, label: '11' },
      };

      // 2. Iterate through each field type configuration
      for (const [key, config] of Object.entries(fieldTypes)) {
        if (config.selected && config.count > 0) {
          const { type, label } =
            fieldTypeMap[key as keyof typeof fieldTypeMap];

          // Create 'count' number of fields for this type
          for (let i = 1; i <= config.count; i++) {
            const field = await tx.field.create({
              data: {
                name: `${label}.${i}`,
                venueId: venue.id,
                fieldType: type,
              },
            });

            // 3. Create Pricing slots for this specific Field
            const typePricing = (pricing as any)[key];
            if (typePricing) {
              // Add Weekday slots
              if (typePricing.weekdays) {
                for (const slot of typePricing.weekdays) {
                  await tx.fieldPricing.create({
                    data: {
                      fieldId: field.id,
                      dayType: DayType.WEEKDAY,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      price: slot.price,
                    },
                  });
                }
              }

              // Add Weekend slots
              if (typePricing.weekends) {
                for (const slot of typePricing.weekends) {
                  await tx.fieldPricing.create({
                    data: {
                      fieldId: field.id,
                      dayType: DayType.WEEKEND,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      price: slot.price,
                    },
                  });
                }
              }
            }
          }
        }
      }

      // Return the complete venue with its fields and pricings
      return tx.venue.findUnique({
        where: { id: venue.id },
        include: {
          fields: {
            include: {
              pricings: true,
            },
          },
          owner: {
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
    });
  }

  async findMyVenues(user: JwtUser) {
    if (user.role === UserRole.FIELD_OWNER && user.ownerId) {
      return this.prisma.venue.findMany({
        where: { ownerId: user.ownerId, isActive: true },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
          phoneNumber: true,
          email: true,
          images: true,
          openTime: true,
          closeTime: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === UserRole.VENUE_MANAGER && user.venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: user.venueId, isActive: true },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
          phoneNumber: true,
          email: true,
          images: true,
          openTime: true,
          closeTime: true,
        },
      });
      return venue ? [venue] : [];
    }

    if (user.role === UserRole.ADMIN) {
      return this.prisma.venue.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('No venues available for this account');
  }

  async findAll(city?: string) {
    const venues = await this.prisma.venue.findMany({
      where: city ? { city, isActive: true } : { isActive: true },
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        fields: {
          where: { isActive: true },
          include: {
            pricings: {
              select: {
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Compute minPrice for each venue from FieldPricing
    return venues.map(venue => {
      const allPrices: number[] = [];
      venue.fields.forEach(field => {
        field.pricings.forEach(pricing => {
          allPrices.push(pricing.price);
        });
      });

      const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

      return {
        ...venue,
        minPrice,
        fields: venue.fields.map(field => ({
          ...field,
          pricings: undefined, // Remove pricings from response
        })),
      };
    });
  }

  async findOne(id: number) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
        fields: {
          include: {
            pricings: true,
            reviews: {
              select: { rating: true },
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    // Compute aggregates from all fields
    const allPrices: number[] = [];
    const allRatings: number[] = [];
    let totalBookings = 0;
    let totalReviews = 0;

    venue.fields.forEach(field => {
      // Collect prices
      field.pricings.forEach(pricing => {
        allPrices.push(pricing.price);
      });
      // Collect ratings
      field.reviews.forEach(review => {
        allRatings.push(review.rating);
      });
      // Sum counts
      totalBookings += field._count.bookings;
      totalReviews += field._count.reviews;
    });

    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const averageRating = allRatings.length > 0
      ? parseFloat((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1))
      : 0;
    const activeFieldCount = venue.fields.filter(f => f.isActive).length;

    // Transform fields to include per-field counts and remove raw reviews
    const transformedFields = venue.fields.map(field => ({
      id: field.id,
      name: field.name,
      fieldType: field.fieldType,
      isActive: field.isActive,
      operationalStatus: field.operationalStatus,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
      venueId: field.venueId,
      pricings: field.pricings,
      reviewCount: field._count.reviews,
      bookingCount: field._count.bookings,
    }));

    return {
      ...venue,
      fields: transformedFields, // deprecated
      fieldsPricings: transformedFields,
      policies: parseVenuePolicies(venue.policies),
      equipment: parseVenuePricedItems(venue.equipment),
      canteenItems: parseVenuePricedItems(venue.canteenItems),
      minPrice,
      averageRating,
      totalBookings,
      totalReviews,
      activeFieldCount,
    };
  }

  async update(id: number, updateVenueDto: UpdateVenueDto) {
    await this.findOne(id);

    return this.prisma.venue.update({
      where: { id },
      data: updateVenueDto,
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.venue.delete({
      where: { id },
    });
  }

  /**
   * Helper: Determine if date is weekend
   */
  private dayTypeForDateString(date: string): DayType {
    return getDayTypeForDate(new Date(`${date}T12:00:00`));
  }

  /**
   * Helper: Extract booked hours from bookings array
   */
  private extractBookedHours(bookings: any[]): Set<number> {
    const bookedHours = new Set<number>();
    bookings.forEach(booking => {
      // TODO: handle timezone
      const startHour = new Date(booking.startTime).getHours();
      const endHour = new Date(booking.endTime).getHours();
      for (let h = startHour; h < endHour; h++) {
        bookedHours.add(h);
      }
    });
    return bookedHours;
  }

  /**
   * Get field type pricing summary for a specific date
   * Returns array of field types with minPrice and availableFieldIds
   */
  async getFieldTypePricingSummary(venueId: number, date: string) {
    // Verify venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    // Get all active fields with pricings
    const fields = await this.prisma.field.findMany({
      where: {
        venueId,
        isActive: true,
      },
      include: {
        pricings: true,
      },
    });

    if (fields.length === 0) {
      return [];
    }

    const dayType = this.dayTypeForDateString(date);

    // Group fields by fieldType
    const grouped: Record<string, typeof fields> = {};
    fields.forEach(field => {
      const type = field.fieldType;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(field);
    });

    // Calculate minPrice for each fieldType
    const result = Object.entries(grouped).map(([fieldType, fieldsOfType]) => {
      const allPrices: number[] = [];

      fieldsOfType.forEach(field => {
        field.pricings
          .filter(pricing => pricing.dayType === dayType)
          .forEach(pricing => {
            allPrices.push(pricing.price);
          });
      });

      const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const availableFieldIds = fieldsOfType.map(f => f.id);

      return {
        fieldType,
        minPrice,
        availableFieldIds,
      };
    });

    return result;
  }

  /**
   * Get field type slots for a specific date
   * Returns array of fields with their time slots (pricing + availability)
   */
  async getFieldTypeSlots(venueId: number, fieldType: string, date: string) {
    // Verify venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        openTime: true,
        closeTime: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    // Get all active fields matching fieldType
    const fields = await this.prisma.field.findMany({
      where: {
        venueId,
        fieldType: fieldType as any,
        isActive: true,
      },
      include: {
        pricings: true,
      },
    });

    if (fields.length === 0) {
      return [];
    }

    const dayType = this.dayTypeForDateString(date);
    const openHour = parseOpenHour(venue.openTime);
    const closeHourExclusive = parseExclusiveCloseHour(venue.closeTime);

    // For each field, generate slots
    const result = await Promise.all(
      fields.map(async (field) => {
        // Get bookings for this field on this date
        const [y, m, d] = date.split('-').map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

        const bookings = await this.prisma.booking.findMany({
          where: {
            fieldId: field.id,
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            startTime: true,
            endTime: true,
          },
        });

        const bookedHours = this.extractBookedHours(bookings);

        // Generate hourly slots
        const slots: {
          startTime: string;
          endTime: string;
          price: number;
          isPeakHour: boolean;
          isAvailable: boolean;
        }[] = [];

        for (let hour = openHour; hour < closeHourExclusive; hour++) {
          // Return ISO format (without timezone) so mobile can convert to local timezone
          const startTime = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
          const endTime = `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`;
          const isPeakHour = hour >= 17 && hour < 21;

          const configuredPrice = findPriceForHour(
            field.pricings,
            dayType,
            hour,
          );
          if (configuredPrice === null) {
            continue;
          }

          const isAvailable = !bookedHours.has(hour);

          slots.push({
            startTime,
            endTime,
            price: configuredPrice,
            isPeakHour,
            isAvailable,
          });
        }

        return {
          fieldId: field.id,
          fieldName: field.name,
          slots,
        };
      })
    );

    return result;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { FieldType, DayType } from '@prisma/client';

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
}

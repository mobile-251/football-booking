import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenueService {
  constructor(private prisma: PrismaService) {}

  async create(createVenueDto: CreateVenueDto) {
    // Verify that ownerId is a valid FieldOwner
    const fieldOwner = await this.prisma.fieldOwner.findUnique({
      where: { id: createVenueDto.ownerId },
    });

    if (!fieldOwner) {
      throw new NotFoundException(
        `FieldOwner with ID ${createVenueDto.ownerId} not found`,
      );
    }

    return this.prisma.venue.create({
      data: createVenueDto,
      include: {
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
  }

  async findAll(city?: string) {
    return this.prisma.venue.findMany({
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
          select: {
            id: true,
            name: true,
            fieldType: true,
            pricePerHour: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
        fields: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    return venue;
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

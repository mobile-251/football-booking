import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueManagerDto } from './dto/create-venue-manager.dto';
import { JwtUser } from '../auth/types/jwt-user.type';

function generateTempPassword(): string {
  return randomBytes(4).toString('hex') + 'A1!';
}

@Injectable()
export class VenueManagerService {
  constructor(private prisma: PrismaService) {}

  private assertOwner(user: JwtUser) {
    if (user.role !== UserRole.FIELD_OWNER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only field owners can manage venue managers');
    }
  }

  async findAllForVenue(venueId: number, user: JwtUser) {
    return this.prisma.venueManager.findMany({
      where: {
        venueId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            mustChangePassword: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(venueId: number, dto: CreateVenueManagerDto, user: JwtUser) {
    this.assertOwner(user);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const record = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          password: hashedPassword,
          role: UserRole.VENUE_MANAGER,
          mustChangePassword: true,
        },
      });

      return tx.venueManager.create({
        data: {
          userId: newUser.id,
          venueId,
          createdById: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      });
    });

    return {
      manager: record,
      credentials: {
        email: dto.email,
        temporaryPassword: tempPassword,
      },
    };
  }

  async deactivate(venueId: number, managerId: number, user: JwtUser) {
    this.assertOwner(user);

    const manager = await this.prisma.venueManager.findFirst({
      where: { id: managerId, venueId, deletedAt: null },
      include: { user: true },
    });

    if (!manager) {
      throw new NotFoundException('Venue manager not found');
    }

    await this.prisma.$transaction([
      this.prisma.venueManager.update({
        where: { id: managerId },
        data: { isActive: false, deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: manager.userId },
        data: { isActive: false },
      }),
    ]);

    return { success: true };
  }

  async resetPassword(venueId: number, managerId: number, user: JwtUser) {
    this.assertOwner(user);

    const manager = await this.prisma.venueManager.findFirst({
      where: { id: managerId, venueId, deletedAt: null },
      include: { user: true },
    });

    if (!manager) {
      throw new NotFoundException('Venue manager not found');
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: manager.userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
        isActive: true,
      },
    });

    await this.prisma.venueManager.update({
      where: { id: managerId },
      data: { isActive: true, deletedAt: null },
    });

    return {
      email: manager.user.email,
      temporaryPassword: tempPassword,
    };
  }
}

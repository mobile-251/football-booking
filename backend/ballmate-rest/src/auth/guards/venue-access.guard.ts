import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VENUE_SCOPE_PARAM_KEY } from '../decorators/venue-scope.decorator';
import { JwtUser } from '../types/jwt-user.type';

@Injectable()
export class VenueAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName =
      this.reflector.getAllAndOverride<string>(VENUE_SCOPE_PARAM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'venueId';

    const request = context.switchToHttp().getRequest<{ user: JwtUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const rawVenueId =
      context.switchToHttp().getRequest().params[paramName] ??
      context.switchToHttp().getRequest().body?.[paramName];

    const venueId = rawVenueId != null ? Number(rawVenueId) : NaN;
    if (!venueId || Number.isNaN(venueId)) {
      throw new ForbiddenException('Venue id is required');
    }

    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, ownerId: true },
    });

    if (!venue) {
      throw new ForbiddenException('Venue not found');
    }

    if (user.role === UserRole.FIELD_OWNER) {
      if (user.ownerId && venue.ownerId === user.ownerId) {
        return true;
      }
      throw new ForbiddenException('You do not have access to this venue');
    }

    if (user.role === UserRole.VENUE_MANAGER) {
      if (user.venueId === venueId) {
        return true;
      }
      throw new ForbiddenException('You do not have access to this venue');
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}

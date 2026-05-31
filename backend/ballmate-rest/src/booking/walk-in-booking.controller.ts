import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VenueAccessGuard } from '../auth/guards/venue-access.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VenueScope } from '../auth/decorators/venue-scope.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { CreateWalkInBookingDto } from './dto/create-walk-in-booking.dto';
import { WalkInBookingService } from './walk-in-booking.service';

@Controller('venues')
export class WalkInBookingController {
  constructor(private readonly walkInBookingService: WalkInBookingService) {}

  @Post(':venueId/walk-in-bookings')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('venueId')
  create(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Body() dto: CreateWalkInBookingDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.walkInBookingService.createWalkIn(
      venueId,
      req.user.id,
      dto,
    );
  }
}

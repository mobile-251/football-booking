import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VenueAccessGuard } from '../auth/guards/venue-access.guard';
import { ComboService } from './combo.service';

@Controller('venues/:venueId/combo-packages')
@UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
@Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
export class ComboVenueController {
  constructor(private comboService: ComboService) {}

  @Get()
  list(@Param('venueId', ParseIntPipe) venueId: number) {
    return this.comboService.listByVenue(venueId);
  }

  @Post()
  create(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Body()
    body: {
      fieldType: string;
      name: string;
      description?: string;
      matchCount: number;
      priceCoin: number;
      validityDays: number;
    },
  ) {
    return this.comboService.createPackage(venueId, body);
  }

  @Patch(':id')
  update(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      matchCount: number;
      priceCoin: number;
      validityDays: number;
      isActive: boolean;
    }>,
  ) {
    return this.comboService.updatePackage(id, venueId, body);
  }

  @Delete(':id')
  remove(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.comboService.deletePackage(id, venueId);
  }
}

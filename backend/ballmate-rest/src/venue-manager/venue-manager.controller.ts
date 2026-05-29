import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VenueAccessGuard } from '../auth/guards/venue-access.guard';
import { VenueScope } from '../auth/decorators/venue-scope.decorator';
import { CreateVenueManagerDto } from './dto/create-venue-manager.dto';
import { VenueManagerService } from './venue-manager.service';

@Controller('venues/:venueId/managers')
@UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
@Roles(UserRole.FIELD_OWNER, UserRole.ADMIN)
@VenueScope('venueId')
export class VenueManagerController {
  constructor(private readonly venueManagerService: VenueManagerService) {}

  @Get()
  findAll(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Request() req: { user: import('../auth/types/jwt-user.type').JwtUser },
  ) {
    return this.venueManagerService.findAllForVenue(venueId, req.user);
  }

  @Post()
  create(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Body() dto: CreateVenueManagerDto,
    @Request() req: { user: import('../auth/types/jwt-user.type').JwtUser },
  ) {
    return this.venueManagerService.create(venueId, dto, req.user);
  }

  @Delete(':managerId')
  deactivate(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Param('managerId', ParseIntPipe) managerId: number,
    @Request() req: { user: import('../auth/types/jwt-user.type').JwtUser },
  ) {
    return this.venueManagerService.deactivate(venueId, managerId, req.user);
  }

  @Post(':managerId/reset-password')
  resetPassword(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Param('managerId', ParseIntPipe) managerId: number,
    @Request() req: { user: import('../auth/types/jwt-user.type').JwtUser },
  ) {
    return this.venueManagerService.resetPassword(venueId, managerId, req.user);
  }
}

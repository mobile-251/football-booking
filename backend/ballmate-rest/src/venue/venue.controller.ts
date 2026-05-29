import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VenueAccessGuard } from '../auth/guards/venue-access.guard';
import { VenueScope } from '../auth/decorators/venue-scope.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';

@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.ADMIN)
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venueService.create(createVenueDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyVenues(@Request() req: { user: JwtUser }) {
    return this.venueService.findMyVenues(req.user);
  }

  @Get()
  findAll(@Query('city') city?: string) {
    return this.venueService.findAll(city);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.venueService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return this.venueService.update(id, updateVenueDto);
  }

  @Get(':id/field-types')
  getFieldTypePricingSummary(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ) {
    return this.venueService.getFieldTypePricingSummary(id, date);
  }

  @Get(':id/field-types/:fieldType/slots')
  getFieldTypeSlots(
    @Param('id', ParseIntPipe) id: number,
    @Param('fieldType') fieldType: string,
    @Query('date') date: string,
  ) {
    return this.venueService.getFieldTypeSlots(id, fieldType, date);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.ADMIN)
  @VenueScope('id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.venueService.remove(id);
  }
}

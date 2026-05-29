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
import { DashboardService } from '../dashboard/dashboard.service';
import { VenueManagementService } from './venue-management.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdateVenueManagementDto } from './dto/update-venue-management.dto';
import { CreateVenueFieldDto } from './dto/create-venue-field.dto';
import { UpdateFieldStatusDto } from './dto/update-field-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VenueAccessGuard } from '../auth/guards/venue-access.guard';
import { VenueScope } from '../auth/decorators/venue-scope.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';

@Controller('venues')
export class VenueController {
  constructor(
    private readonly venueService: VenueService,
    private readonly dashboardService: DashboardService,
    private readonly venueManagementService: VenueManagementService,
  ) {}

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

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('id')
  getDashboard(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtUser },
  ) {
    return this.dashboardService.getVenueDashboard(id, req.user.id);
  }

  @Get(':id/management')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('id')
  getManagement(@Param('id', ParseIntPipe) id: number) {
    return this.venueManagementService.getManagementDetail(id);
  }

  @Patch(':id/management')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('id')
  updateManagement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVenueManagementDto,
  ) {
    return this.venueManagementService.updateManagement(id, dto);
  }

  @Post(':id/fields')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('id')
  createField(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVenueFieldDto,
  ) {
    return this.venueManagementService.createField(id, dto);
  }

  @Patch(':id/fields/:fieldId/status')
  @UseGuards(JwtAuthGuard, RolesGuard, VenueAccessGuard)
  @Roles(UserRole.FIELD_OWNER, UserRole.VENUE_MANAGER, UserRole.ADMIN)
  @VenueScope('id')
  updateFieldStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Body() dto: UpdateFieldStatusDto,
  ) {
    return this.venueManagementService.updateFieldStatus(
      id,
      fieldId,
      dto.operationalStatus,
    );
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

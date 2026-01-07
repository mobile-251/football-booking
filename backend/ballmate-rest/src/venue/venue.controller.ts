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
} from '@nestjs/common';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) { }

  @Post()
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venueService.create(createVenueDto);
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return this.venueService.update(id, updateVenueDto);
  }

  /**
   * Get field type pricing summary for a specific date
   * Returns array of field types with minPrice and availableFieldIds
   */
  @Get(':id/field-types')
  getFieldTypePricingSummary(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ) {
    return this.venueService.getFieldTypePricingSummary(id, date);
  }

  /**
   * Get field slots for a specific field type and date
   * Returns array of fields with time slots (pricing + availability)
   */
  @Get(':id/field-types/:fieldType/slots')
  getFieldTypeSlots(
    @Param('id', ParseIntPipe) id: number,
    @Param('fieldType') fieldType: string,
    @Query('date') date: string,
  ) {
    return this.venueService.getFieldTypeSlots(id, fieldType, date);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.venueService.remove(id);
  }
}

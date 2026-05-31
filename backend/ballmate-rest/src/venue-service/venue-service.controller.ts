import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { VenueServiceCatalogService } from './venue-service.service';

@Controller('venues')
export class VenueServiceController {
  constructor(private catalog: VenueServiceCatalogService) {}

  @Get(':venueId/services')
  list(@Param('venueId', ParseIntPipe) venueId: number) {
    return this.catalog.listByVenue(venueId);
  }
}

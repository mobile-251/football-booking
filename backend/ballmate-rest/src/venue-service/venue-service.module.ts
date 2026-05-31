import { Module } from '@nestjs/common';
import { VenueServiceCatalogService } from './venue-service.service';
import { VenueServiceController } from './venue-service.controller';

@Module({
  providers: [VenueServiceCatalogService],
  controllers: [VenueServiceController],
  exports: [VenueServiceCatalogService],
})
export class VenueServiceModule {}

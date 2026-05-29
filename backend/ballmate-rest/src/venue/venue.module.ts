import { Module } from '@nestjs/common';
import { VenueService } from './venue.service';
import { VenueController } from './venue.controller';
import { VenueManagementService } from './venue-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, AuthModule, DashboardModule],
  controllers: [VenueController],
  providers: [VenueService, VenueManagementService],
  exports: [VenueService, VenueManagementService],
})
export class VenueModule {}

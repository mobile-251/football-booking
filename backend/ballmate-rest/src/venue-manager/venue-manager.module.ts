import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { VenueManagerController } from './venue-manager.controller';
import { VenueManagerService } from './venue-manager.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VenueManagerController],
  providers: [VenueManagerService],
  exports: [VenueManagerService],
})
export class VenueManagerModule {}

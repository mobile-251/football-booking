import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { WalkInBookingController } from './walk-in-booking.controller';
import { WalkInBookingService } from './walk-in-booking.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { SepayModule } from '../sepay/sepay.module';

@Module({
  imports: [PrismaModule, NotificationModule, AuthModule, SepayModule],
  controllers: [BookingController, WalkInBookingController],
  providers: [BookingService, WalkInBookingService],
  exports: [BookingService, WalkInBookingService],
})
export class BookingModule { }


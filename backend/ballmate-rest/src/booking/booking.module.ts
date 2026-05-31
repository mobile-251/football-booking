import { Module, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingCoinService } from './booking-coin.service';
import { BookingController } from './booking.controller';
import { WalkInBookingController } from './walk-in-booking.controller';
import { WalkInBookingService } from './walk-in-booking.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { SepayModule } from '../sepay/sepay.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    AuthModule,
    forwardRef(() => SepayModule),
    WalletModule,
  ],
  controllers: [BookingController, WalkInBookingController],
  providers: [BookingService, WalkInBookingService, BookingCoinService],
  exports: [BookingService, WalkInBookingService, BookingCoinService],
})
export class BookingModule {}


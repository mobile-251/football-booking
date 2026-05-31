import { Module, forwardRef } from '@nestjs/common';
import { TopUpService } from './top-up.service';
import { TopUpController } from './top-up.controller';
import { AdminTopUpController } from './admin-top-up.controller';
import { WalletModule } from '../wallet/wallet.module';
import { SepayModule } from '../sepay/sepay.module';
import { BookingModule } from '../booking/booking.module';
import { ComboModule } from '../combo/combo.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    WalletModule,
    NotificationModule,
    forwardRef(() => SepayModule),
    forwardRef(() => BookingModule),
    forwardRef(() => ComboModule),
  ],
  providers: [TopUpService],
  controllers: [TopUpController, AdminTopUpController],
  exports: [TopUpService],
})
export class TopUpModule {}

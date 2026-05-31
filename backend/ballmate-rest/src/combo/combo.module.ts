import { Module } from '@nestjs/common';
import { ComboService } from './combo.service';
import { ComboController } from './combo.controller';
import { ComboVenueController } from './combo-venue.controller';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [WalletModule, NotificationModule],
  providers: [ComboService],
  controllers: [ComboController, ComboVenueController],
  exports: [ComboService],
})
export class ComboModule {}

import { Module } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';
import { AdminCheckInController } from './admin-check-in.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  providers: [CheckInService],
  controllers: [CheckInController, AdminCheckInController],
  exports: [CheckInService],
})
export class CheckInModule {}

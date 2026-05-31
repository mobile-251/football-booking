import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { TopUpModule } from '../top-up/top-up.module';
import { SepayService } from './sepay.service';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';

@Module({
  imports: [PrismaModule, NotificationModule, forwardRef(() => TopUpModule)],
  controllers: [SepayWebhookController],
  providers: [SepayService, SepayWebhookService],
  exports: [SepayService, SepayWebhookService],
})
export class SepayModule {}

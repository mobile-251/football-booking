import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SepayService } from './sepay.service';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';

@Module({
  imports: [PrismaModule],
  controllers: [SepayWebhookController],
  providers: [SepayService, SepayWebhookService],
  exports: [SepayService, SepayWebhookService],
})
export class SepayModule {}

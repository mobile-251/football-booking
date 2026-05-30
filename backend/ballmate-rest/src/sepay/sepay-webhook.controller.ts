import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
} from '@nestjs/common';
import { SepayWebhookPayloadDto } from './dto/sepay-webhook-payload.dto';
import { SepayWebhookService } from './sepay-webhook.service';

@Controller()
export class SepayWebhookController {
  constructor(private readonly webhookService: SepayWebhookService) {}

  @Post('webhooks/sepay')
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: SepayWebhookPayloadDto,
    @Headers('authorization') authorization?: string,
  ) {
    this.webhookService.verifyRequest(authorization);
    await this.webhookService.handleIncomingTransfer(payload);
    return { success: true };
  }
}

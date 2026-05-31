import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SepayWebhookPayloadDto } from './dto/sepay-webhook-payload.dto';
import { SepayWebhookService } from './sepay-webhook.service';
import { SepayService } from './sepay.service';

@Controller()
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(
    private readonly webhookService: SepayWebhookService,
    private readonly sepayService: SepayService,
  ) {}

  @Post('webhooks/sepay')
  @HttpCode(200)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async handleWebhook(
    @Body() payload: SepayWebhookPayloadDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!this.sepayService.isWebhookEnabled()) {
      return { success: true, skipped: 'webhook_disabled' };
    }

    const authorization = this.sepayService.resolveAuthorizationHeader(headers);
    try {
      this.webhookService.verifyRequest(authorization);
      return await this.webhookService.handleIncomingTransfer(payload);
    } catch (err) {
      this.logger.error(
        `SePay webhook rejected id=${payload?.id}: ${String(err)}`,
      );
      throw err;
    }
  }
}

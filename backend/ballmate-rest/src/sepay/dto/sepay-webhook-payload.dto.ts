import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class SepayWebhookPayloadDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  subAccount?: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  @IsIn(['in', 'out'])
  transferType: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  transferAmount: number;

  @IsOptional()
  @IsNumber()
  accumulated?: number;

  @IsOptional()
  @IsString()
  referenceCode?: string;
}

export type SepayWebhookPayload = SepayWebhookPayloadDto;

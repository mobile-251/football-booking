import {
  IsArray,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookingServiceItemDto {
  @IsInt()
  venueServiceId: number;

  @IsInt()
  quantity: number;
}

export class ConfirmCoinBookingDto {
  @IsNumber()
  fieldId: number;

  @IsNumber()
  playerId: number;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsInt()
  playerComboId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingServiceItemDto)
  services?: BookingServiceItemDto[];

  @IsOptional()
  extrasJson?: Record<string, unknown>;
}

export class PreviewCoinBookingDto {
  @IsNumber()
  fieldId: number;

  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;

  @IsOptional()
  @IsInt()
  playerComboId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingServiceItemDto)
  services?: BookingServiceItemDto[];
}

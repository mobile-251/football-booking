import { IsNumber, IsISO8601, IsString, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  fieldId: number;

  @IsNumber()
  playerId: number; // Now refers to Player.id, not User.id

  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsString()
  note?: string;
}

import { DayType } from '@prisma/client';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export class UpdatePricingRowDto {
  @IsEnum(DayType)
  dayType: DayType;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(0)
  price: number;
}

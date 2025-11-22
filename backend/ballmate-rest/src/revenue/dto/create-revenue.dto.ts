import { IsNumber, IsOptional, IsISO8601 } from 'class-validator';

export class CreateRevenueReportDto {
  @IsOptional()
  @IsNumber()
  venueId?: number;

  @IsOptional()
  @IsNumber()
  fieldId?: number;

  @IsNumber()
  totalRevenue: number;

  @IsNumber()
  totalBookings: number;

  @IsISO8601()
  reportDate: string;
}

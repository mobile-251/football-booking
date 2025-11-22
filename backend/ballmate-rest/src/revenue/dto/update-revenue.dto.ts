import { PartialType } from '@nestjs/mapped-types';
import { CreateRevenueReportDto } from './create-revenue.dto';

export class UpdateRevenueReportDto extends PartialType(
  CreateRevenueReportDto,
) {}

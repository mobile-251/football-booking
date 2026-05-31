import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { TopUpPurpose } from '@prisma/client';

export class CreateTopUpOrderDto {
  @IsOptional()
  @IsInt()
  packageId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  amountVnd?: number;

  @IsOptional()
  @IsEnum(TopUpPurpose)
  purpose?: TopUpPurpose;

  @IsOptional()
  @IsInt()
  holdId?: number;

  @IsOptional()
  @IsInt()
  comboPackageId?: number;
}

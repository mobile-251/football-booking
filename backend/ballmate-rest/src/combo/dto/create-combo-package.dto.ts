import { FieldType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateComboPackageDto {
  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(500)
  matchCount: number;

  @IsInt()
  @Min(1)
  @Max(100_000_000)
  priceCoin: number;

  @IsInt()
  @Min(1)
  @Max(3650)
  validityDays: number;
}

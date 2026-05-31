import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateComboPackageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  matchCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  priceCoin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  validityDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

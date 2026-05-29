import { FieldType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, ValidateNested } from 'class-validator';
import { UpdatePricingRowDto } from './update-pricing-row.dto';

export class UpdatePricingGroupDto {
  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePricingRowDto)
  rows: UpdatePricingRowDto[];
}

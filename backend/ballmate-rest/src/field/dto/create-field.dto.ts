import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { FieldType } from '@prisma/client';

export class CreateFieldDto {
  @IsString()
  name: string;

  @IsNumber()
  venueId: number;

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsNumber()
  pricePerHour: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

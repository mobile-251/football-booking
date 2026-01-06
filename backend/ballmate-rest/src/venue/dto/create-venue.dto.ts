import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldTypesDto } from './field-types.dto';
import { FieldPricingDto } from './field-pricing.dto';

export class VenuePricingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FieldPricingDto)
  field5?: FieldPricingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldPricingDto)
  field7?: FieldPricingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FieldPricingDto)
  field11?: FieldPricingDto;
}

export class CreateVenueDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  openTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  closeTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Type(() => Number)
  @IsNumber()
  ownerId: number;

  @ValidateNested()
  @Type(() => FieldTypesDto)
  fieldTypes: FieldTypesDto;

  @ValidateNested()
  @Type(() => VenuePricingDto)
  pricing: VenuePricingDto;
}
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePricingGroupDto } from './update-pricing-group.dto';
import { PricedItemDto } from './priced-item.dto';
import { UpdatePoliciesDto } from './update-policies.dto';

export class UpdateFieldNameDto {
  @IsInt()
  id: number;

  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateVenueManagementDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricedItemDto)
  equipment?: PricedItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricedItemDto)
  canteenItems?: PricedItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePoliciesDto)
  policies?: UpdatePoliciesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePricingGroupDto)
  pricing?: UpdatePricingGroupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldNameDto)
  fieldNames?: UpdateFieldNameDto[];
}

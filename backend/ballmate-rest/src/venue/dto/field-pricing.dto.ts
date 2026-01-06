import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingSlotDto } from './pricing-slot.dto';

export class FieldPricingDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PricingSlotDto)
    weekdays: PricingSlotDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PricingSlotDto)
    weekends: PricingSlotDto[];
}
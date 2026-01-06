import { IsString, IsNumber, Matches } from 'class-validator';

export class PricingSlotDto {
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    startTime: string;
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    endTime: string;
    @IsNumber()
    price: number;
}
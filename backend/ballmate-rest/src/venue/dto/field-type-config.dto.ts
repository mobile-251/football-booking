import { IsBoolean, IsNumber } from 'class-validator';

export class FieldTypeConfigDto {
    @IsBoolean()
    selected: boolean;

    @IsNumber()
    count: number;
}
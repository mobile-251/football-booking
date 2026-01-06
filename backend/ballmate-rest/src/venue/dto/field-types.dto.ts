import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FieldTypeConfigDto } from './field-type-config.dto';

export class FieldTypesDto {
    @ValidateNested()
    @Type(() => FieldTypeConfigDto)
    field5: FieldTypeConfigDto;

    @ValidateNested()
    @Type(() => FieldTypeConfigDto)
    field7: FieldTypeConfigDto;

    @ValidateNested()
    @Type(() => FieldTypeConfigDto)
    field11: FieldTypeConfigDto;
}
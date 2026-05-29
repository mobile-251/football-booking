import { FieldType } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateVenueFieldDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(FieldType)
  fieldType: FieldType;
}

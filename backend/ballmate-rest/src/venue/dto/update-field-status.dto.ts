import { FieldOperationalStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateFieldStatusDto {
  @IsEnum(FieldOperationalStatus)
  operationalStatus: FieldOperationalStatus;
}

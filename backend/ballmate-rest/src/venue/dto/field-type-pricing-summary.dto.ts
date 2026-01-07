import { FieldType } from '@prisma/client';

export class FieldTypePricingSummaryDto {
    fieldType: FieldType;
    minPrice: number;
    availableFieldIds: number[];
}

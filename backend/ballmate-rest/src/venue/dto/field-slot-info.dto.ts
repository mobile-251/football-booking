export class TimeSlotInfoDto {
    startTime: string;
    endTime: string;
    price: number;
    isPeakHour: boolean;
    isAvailable: boolean;
}

export class FieldSlotInfoDto {
    fieldId: number;
    fieldName: string;
    slots: TimeSlotInfoDto[];
}

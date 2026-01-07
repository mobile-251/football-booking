import { IsString } from 'class-validator';

export class CompleteBookingDto {
    @IsString()
    bookingCode: string; // Mã đặt sân do Player cung cấp
}

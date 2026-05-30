import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateWalkInBookingDto {
  @IsInt()
  fieldId: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be YYYY-MM-DD',
  })
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be HH:mm',
  })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be HH:mm',
  })
  endTime: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsOptional()
  @IsString()
  note?: string;
}

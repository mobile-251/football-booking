import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumberString } from 'class-validator';
import { ALLOWED_IMAGE_TYPES } from '../constants/file.constants';

export class UploadImageDto {
    @ApiProperty({
        description: 'Loại ảnh',
        enum: ALLOWED_IMAGE_TYPES,
        example: 'venue',
    })
    @IsNotEmpty()
    @IsIn([...ALLOWED_IMAGE_TYPES])
    type: string;

    @ApiProperty({
        description: 'ID của đối tượng sở hữu (venueId)',
        example: '1',
    })
    @IsNotEmpty()
    @IsNumberString()
    ownerId: string;
}

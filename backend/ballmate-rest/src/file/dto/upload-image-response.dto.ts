import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
    @ApiProperty({
        description: 'URL ảnh trên S3',
        example: 'https://ballmate-dev-bucket.s3.ap-southeast-1.amazonaws.com/images/venue/1/abc123.png',
    })
    url: string;

    @ApiProperty({
        description: 'S3 object key',
        example: 'images/venue/1/abc123.png',
    })
    key: string;

    @ApiProperty({
        description: 'Loại ảnh',
        example: 'venue',
    })
    type: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({
        description: 'HTTP status code',
        example: 400,
    })
    statusCode: number;

    @ApiProperty({
        description: 'Error message or array of validation error messages',
        example: 'Email already exists',
        oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
        ],
    })
    message: string | string[];

    @ApiProperty({
        description: 'Error type',
        example: 'Bad Request',
    })
    error: string;
}

export class ValidationErrorResponseDto {
    @ApiProperty({
        description: 'HTTP status code',
        example: 400,
    })
    statusCode: number;

    @ApiProperty({
        description: 'Array of validation error messages',
        example: [
            'email must be an email',
            'Password must be at least 6 characters',
            'Full name must be at least 2 characters',
        ],
        type: [String],
    })
    message: string[];

    @ApiProperty({
        description: 'Error type',
        example: 'Bad Request',
    })
    error: string;
}

export class ConflictErrorResponseDto {
    @ApiProperty({
        description: 'HTTP status code',
        example: 409,
    })
    statusCode: number;

    @ApiProperty({
        description: 'Error message',
        example: 'Email already exists',
    })
    message: string;

    @ApiProperty({
        description: 'Error type',
        example: 'Conflict',
    })
    error: string;
}

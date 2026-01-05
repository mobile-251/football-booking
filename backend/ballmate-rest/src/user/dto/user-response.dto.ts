import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: 1,
    })
    id: number;

    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    email: string;

    @ApiProperty({
        description: 'Full name of the user',
        example: 'John Doe',
    })
    fullName: string;

    @ApiProperty({
        description: 'Phone number of the user',
        example: '+84901234567',
        nullable: true,
    })
    phoneNumber: string | null;

    @ApiProperty({
        description: 'User role in the system',
        enum: UserRole,
        example: UserRole.PLAYER,
    })
    role: UserRole;

    @ApiProperty({
        description: 'URL to user avatar image',
        example: 'https://example.com/avatar.jpg',
        nullable: true,
    })
    avatarUrl: string | null;

    @ApiProperty({
        description: 'Whether the user account is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Timestamp when the user was created',
        example: '2024-12-01T14:30:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Timestamp when the user was last updated',
        example: '2024-12-01T14:30:00.000Z',
    })
    updatedAt: Date;
}

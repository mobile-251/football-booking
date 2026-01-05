import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
    required: true,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    required: true,
  })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  fullName: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+84901234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.PLAYER,
    default: UserRole.PLAYER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.PLAYER;

  @ApiProperty({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

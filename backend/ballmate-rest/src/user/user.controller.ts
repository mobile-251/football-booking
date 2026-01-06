import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import {
  ValidationErrorResponseDto,
  ConflictErrorResponseDto,
} from './dto/error-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description:
      'Register a new user account with email and password. The password will be hashed before storing. Returns the created user data without the password.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data',
    examples: {
      player: {
        summary: 'Player registration',
        value: {
          email: 'player@example.com',
          password: 'password123',
          fullName: 'John Doe',
          phoneNumber: '+84901234567',
          role: 'PLAYER',
        },
      },
      owner: {
        summary: 'Field owner registration',
        value: {
          email: 'owner@example.com',
          password: 'securepass456',
          fullName: 'Jane Smith',
          phoneNumber: '+84912345678',
          role: 'FIELD_OWNER',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'User successfully created. Returns user data without password.',
    type: UserResponseDto,
    example: {
      id: 1,
      email: 'player@example.com',
      fullName: 'John Doe',
      phoneNumber: '+84901234567',
      role: 'PLAYER',
      avatarUrl: null,
      isActive: true,
      createdAt: '2024-12-01T14:30:00.000Z',
      updatedAt: '2024-12-01T14:30:00.000Z',
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed. Invalid input data.',
    type: ValidationErrorResponseDto,
    examples: {
      invalidEmail: {
        summary: 'Invalid email format',
        value: {
          statusCode: 400,
          message: ['email must be an email'],
          error: 'Bad Request',
        },
      },
      shortPassword: {
        summary: 'Password too short',
        value: {
          statusCode: 400,
          message: ['Password must be at least 6 characters'],
          error: 'Bad Request',
        },
      },
      multipleErrors: {
        summary: 'Multiple validation errors',
        value: {
          statusCode: 400,
          message: [
            'email must be an email',
            'Password must be at least 6 characters',
            'Full name must be at least 2 characters',
          ],
          error: 'Bad Request',
        },
      },
      missingFields: {
        summary: 'Missing required fields',
        value: {
          statusCode: 400,
          message: [
            'email should not be empty',
            'password should not be empty',
            'fullName should not be empty',
          ],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists in the system.',
    type: ConflictErrorResponseDto,
    example: {
      statusCode: 409,
      message: 'Email already exists',
      error: 'Conflict',
    },
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}

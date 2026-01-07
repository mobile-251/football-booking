import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileService } from './file.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { UserRole } from '@prisma/client';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from './constants/file.constants';

@ApiTags('Files')
@Controller('api/v1/files')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @Post('images')
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.ADMIN, UserRole.FIELD_OWNER)
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: MAX_FILE_SIZE,
            },
            fileFilter: (req, file, callback) => {
                if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
                    return callback(new BadRequestException('INVALID_FILE'), false);
                }
                callback(null, true);
            },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload ảnh venue' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File ảnh (max 5MB, jpeg/png/webp)',
                },
                type: {
                    type: 'string',
                    enum: ['venue'],
                    description: 'Loại ảnh',
                },
                ownerId: {
                    type: 'string',
                    description: 'ID của venue',
                },
            },
            required: ['file', 'type', 'ownerId'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Upload thành công',
        type: UploadImageResponseDto,
    })
    @ApiResponse({ status: 400, description: 'INVALID_FILE hoặc INVALID_TYPE' })
    @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
    @ApiResponse({ status: 403, description: 'FORBIDDEN' })
    @ApiResponse({ status: 413, description: 'FILE_TOO_LARGE' })
    @ApiResponse({ status: 500, description: 'UPLOAD_FAILED' })
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadImageDto,
        @CurrentUser() user: JwtUser,
    ): Promise<UploadImageResponseDto> {
        if (!file) {
            throw new BadRequestException('INVALID_FILE');
        }

        if (dto.type !== 'venue') {
            throw new BadRequestException('INVALID_TYPE');
        }

        const venueId = parseInt(dto.ownerId, 10);
        return this.fileService.uploadVenueImage(file, venueId, user);
    }
}

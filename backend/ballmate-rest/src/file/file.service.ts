import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    PayloadTooLargeException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { VenueService } from '../venue/venue.service';
import type { JwtUser } from '../auth/types/jwt-user.type';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import {
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES,
    AllowedMimeType,
} from './constants/file.constants';

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);
    private readonly s3Client: S3Client;
    private readonly bucket: string;
    private readonly region: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly venueService: VenueService,
    ) {
        this.region = this.configService.get<string>('AWS_REGION', 'ap-southeast-1');
        this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');

        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
            },
        });
    }

    async uploadVenueImage(
        file: Express.Multer.File,
        venueId: number,
        user: JwtUser,
    ): Promise<UploadImageResponseDto> {
        // 1. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new PayloadTooLargeException('FILE_TOO_LARGE');
        }

        // 2. Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as AllowedMimeType)) {
            throw new BadRequestException('INVALID_FILE');
        }

        // 3. Check venue exists and ownership
        const venue = await this.venueService.findOne(venueId);

        // 4. Check ownership for FIELD_OWNER
        if (user.role === 'FIELD_OWNER') {
            if (venue.ownerId !== user.ownerId) {
                throw new ForbiddenException('FORBIDDEN');
            }
        }

        // 5. Generate S3 key
        const extension = this.getExtensionFromMimeType(file.mimetype);
        const key = `images/venue/${venueId}/${uuidv4()}.${extension}`;

        // 6. Upload to S3
        try {
            const uploadParams: PutObjectCommandInput = {
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            await this.s3Client.send(new PutObjectCommand(uploadParams));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to upload file to S3: ${errorMessage}`, errorStack);
            throw new InternalServerErrorException('UPLOAD_FAILED');
        }

        // 7. Build and return response
        const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

        return {
            url,
            key,
            type: 'venue',
        };
    }

    private getExtensionFromMimeType(mimeType: string): string {
        const mimeToExt: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        return mimeToExt[mimeType] || 'jpg';
    }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { VenueModule } from '../venue/venue.module';

@Module({
    imports: [ConfigModule, VenueModule],
    controllers: [FileController],
    providers: [FileService],
    exports: [FileService],
})
export class FileModule { }

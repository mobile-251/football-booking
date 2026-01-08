import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
    let service: PrismaService;

    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrismaService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have onModuleInit', async () => {
        // Mock $connect
        service.$connect = jest.fn().mockResolvedValue(undefined);
        await service.onModuleInit();
        expect(service.$connect).toHaveBeenCalled();
    });
});

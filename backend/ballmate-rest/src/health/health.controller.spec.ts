import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { getToken } from '@willsoto/nestjs-prometheus';

describe('HealthController', () => {
    let controller: HealthController;
    let health: jest.Mocked<HealthCheckService>;

    const mockCounter = {
        inc: jest.fn(),
    };

    beforeEach(async () => {
        const mockHealthCheckService = {
            check: jest.fn(),
        };
        const mockHttpHealthIndicator = {
            pingCheck: jest.fn(),
        };
        const mockPrismaService = {
            $queryRaw: jest.fn(),
        };
        const mockConfigService = {
            get: jest.fn().mockReturnValue(3000),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: HealthCheckService, useValue: mockHealthCheckService },
                { provide: HttpHealthIndicator, useValue: mockHttpHealthIndicator },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: getToken('health_check_calls_total'), useValue: mockCounter },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        health = module.get(HealthCheckService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('check', () => {
        it('should check health', async () => {
            health.check.mockResolvedValue({
                status: 'ok',
                info: {},
                error: {},
                details: {},
            });

            const result = await controller.check();

            expect(result.status).toBe('ok');
            expect(mockCounter.inc).toHaveBeenCalled();
            expect(health.check).toHaveBeenCalled();
        });
    });
});

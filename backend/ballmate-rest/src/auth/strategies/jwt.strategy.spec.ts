import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let prismaService: jest.Mocked<PrismaService>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(async () => {
        const mockPrismaService = {
            user: {
                findUnique: jest.fn(),
            },
        };

        const mockConfigService = {
            get: jest.fn().mockReturnValue('test-secret'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
        prismaService = module.get(PrismaService);
        configService = module.get(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    describe('validate', () => {
        it('should return user object if user exists and is active', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'PLAYER',
                isActive: true,
                player: { id: 100 },
                owner: null,
            };
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const payload = { sub: 1, email: 'test@example.com', role: 'PLAYER' };
            const result = await strategy.validate(payload);

            expect(result).toEqual({
                ...mockUser,
                playerId: 100,
                ownerId: undefined,
            });
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: expect.any(Object),
            });
        });

        it('should throw UnauthorizedException if user does not exist', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            const payload = { sub: 1, email: 'test@example.com', role: 'PLAYER' };

            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user is inactive', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
                id: 1,
                isActive: false,
            });

            const payload = { sub: 1, email: 'test@example.com', role: 'PLAYER' };

            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
        });
    });
});

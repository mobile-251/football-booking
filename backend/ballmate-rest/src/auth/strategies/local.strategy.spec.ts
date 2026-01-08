import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
    let strategy: LocalStrategy;
    let authService: jest.Mocked<AuthService>;

    beforeEach(async () => {
        const mockAuthService = {
            validateUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocalStrategy,
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        strategy = module.get<LocalStrategy>(LocalStrategy);
        authService = module.get(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    describe('validate', () => {
        it('should return user if validation succeeds', async () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            authService.validateUser.mockResolvedValue(mockUser as any);

            const result = await strategy.validate('test@example.com', 'password');

            expect(result).toEqual(mockUser);
            expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password');
        });

        it('should throw UnauthorizedException if validation fails', async () => {
            authService.validateUser.mockResolvedValue(null);

            await expect(strategy.validate('test@example.com', 'wrong')).rejects.toThrow(UnauthorizedException);
        });
    });
});

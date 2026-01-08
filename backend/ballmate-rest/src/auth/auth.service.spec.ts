import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    fullName: 'Test User',
    phoneNumber: '0123456789',
    role: 'PLAYER',
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlayer = {
    id: 1,
    userId: 1,
  };

  const mockAccessToken = 'mock.access.token';
  const mockRefreshToken = 'mock.refresh.token';

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      player: {
        findUnique: jest.fn(),
      },
    };

    const mockUserService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // REGISTER TESTS
  // ============================================
  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      phoneNumber: '0987654321',
    };

    it('should throw ConflictException if email already exists', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
    });

    it('should create user and return tokens on success', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (userService.create as jest.Mock).mockResolvedValue({
        id: 2,
        email: registerDto.email,
        fullName: registerDto.fullName,
        role: 'PLAYER',
      });
      (configService.get as jest.Mock).mockReturnValue('secret');
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token', mockAccessToken);
      expect(result).toHaveProperty('refresh_token', mockRefreshToken);
      expect(result.user).toHaveProperty('email', registerDto.email);
      expect(userService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should not include password in returned user object', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (userService.create as jest.Mock).mockResolvedValue({
        id: 2,
        email: registerDto.email,
        fullName: registerDto.fullName,
        role: 'PLAYER',
        password: 'should_not_be_included',
      });
      (configService.get as jest.Mock).mockReturnValue('secret');
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.register(registerDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ============================================
  // LOGIN TESTS
  // ============================================
  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Account is deactivated');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should return tokens and user info on successful login', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (configService.get as jest.Mock).mockReturnValue('secret');
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);
      (prismaService.player.findUnique as jest.Mock).mockResolvedValue(mockPlayer);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', mockAccessToken);
      expect(result).toHaveProperty('refresh_token', mockRefreshToken);
      expect(result.user).toHaveProperty('email', mockUser.email);
      expect(result.user).toHaveProperty('role', 'PLAYER');
    });

    it('should include player info for PLAYER role', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (configService.get as jest.Mock).mockReturnValue('secret');
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);
      (prismaService.player.findUnique as jest.Mock).mockResolvedValue(mockPlayer);

      const result = await service.login(loginDto);

      expect(result.user.player).toEqual(mockPlayer);
    });

    it('should not include player info for non-PLAYER role', async () => {
      const ownerUser = { ...mockUser, role: 'FIELD_OWNER' };
      (userService.findByEmail as jest.Mock).mockResolvedValue(ownerUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (configService.get as jest.Mock).mockReturnValue('secret');
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.login(loginDto);

      expect(result.user.player).toBeNull();
      expect(prismaService.player.findUnique).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // REFRESH TOKEN TESTS
  // ============================================
  describe('refreshToken', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshToken(99999)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(99999)).rejects.toThrow('Access denied');
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.refreshToken(1)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(1)).rejects.toThrow('Access denied');
    });

    it('should return new tokens for valid active user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: mockUser.email,
        role: 'PLAYER',
        isActive: true,
      });
      (configService.get as jest.Mock).mockReturnValue('secret');
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');

      const result = await service.refreshToken(1);

      expect(result).toHaveProperty('access_token', 'new.access.token');
      expect(result).toHaveProperty('refresh_token', 'new.refresh.token');
    });
  });

  // ============================================
  // VALIDATE USER TESTS
  // ============================================
  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockUser.email, 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return user if email and password are valid', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'password123');

      expect(result).toEqual(mockUser);
    });
  });

  // ============================================
  // GET USER FROM TOKEN TESTS
  // ============================================
  describe('getUserFromToken', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.getUserFromToken('invalid.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user data for valid token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 1,
        email: mockUser.email,
        role: 'PLAYER',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: 'PLAYER',
        isActive: true,
      });

      const result = await service.getUserFromToken('valid.token');

      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('fullName', mockUser.fullName);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });
  });

  // ============================================
  // GENERATE TOKENS (private method - tested indirectly)
  // ============================================
  describe('generateTokens (indirectly via register/login)', () => {
    it('should use correct JWT secret from config', async () => {
      const testSecret = 'test-jwt-secret';
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (userService.create as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'test@test.com',
        fullName: 'Test',
        role: 'PLAYER',
      });
      (configService.get as jest.Mock).mockImplementation((key: string, defaultVal: any) => {
        if (key === 'jwt.secret') return testSecret;
        if (key === 'jwt.accessTokenExpiry') return '15m';
        if (key === 'jwt.refreshTokenExpiry') return '7d';
        return defaultVal;
      });
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      await service.register({
        email: 'test@test.com',
        password: 'password',
        fullName: 'Test',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ secret: testSecret }),
      );
    });

    it('should use default values when config is not set', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (userService.create as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'test@test.com',
        fullName: 'Test',
        role: 'PLAYER',
      });
      (configService.get as jest.Mock).mockReturnValue(undefined);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.register({
        email: 'test@test.com',
        password: 'password',
        fullName: 'Test',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });
});

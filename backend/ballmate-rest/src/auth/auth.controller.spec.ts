import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with dto', async () => {
      const registerDto = {
        email: 'test@test.com',
        password: 'password123',
        fullName: 'Test User',
      };
      const mockResponse = { access_token: 'token', user: { id: 1 } };
      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should call authService.login with dto', async () => {
      const loginDto = { email: 'test@test.com', password: 'password123' };
      const mockResponse = { access_token: 'token', user: { id: 1 } };
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with user id', async () => {
      const mockUser = { id: 1, email: 'test@test.com', role: 'PLAYER' };
      const mockResponse = { access_token: 'new_token' };
      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(mockUser);

      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should return current user', () => {
      const mockUser = { id: 1, email: 'test@test.com', role: 'PLAYER' };

      const result = controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
    });
  });
});

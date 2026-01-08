import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
    let controller: UserController;
    let userService: jest.Mocked<UserService>;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        phoneNumber: '0123456789',
        role: 'PLAYER',
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUserService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [{ provide: UserService, useValue: mockUserService }],
        }).compile();

        controller = module.get<UserController>(UserController);
        userService = module.get(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a user', async () => {
            const createDto = {
                email: 'new@example.com',
                password: 'password123',
                fullName: 'New User',
                phoneNumber: '0987654321',
                role: 'PLAYER' as const,
            };
            mockUserService.create.mockResolvedValue({ ...mockUser, ...createDto });

            const result = await controller.create(createDto);

            expect(result.email).toBe('new@example.com');
            expect(userService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            mockUserService.findAll.mockResolvedValue([mockUser]);

            const result = await controller.findAll();

            expect(result).toEqual([mockUser]);
            expect(userService.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return user by id', async () => {
            mockUserService.findOne.mockResolvedValue(mockUser);

            const result = await controller.findOne(1);

            expect(result).toEqual(mockUser);
            expect(userService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            const updateDto = { fullName: 'Updated Name' };
            mockUserService.update.mockResolvedValue({ ...mockUser, fullName: 'Updated Name' });

            const result = await controller.update(1, updateDto);

            expect(result.fullName).toBe('Updated Name');
            expect(userService.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('remove', () => {
        it('should remove user', async () => {
            mockUserService.remove.mockResolvedValue(mockUser);

            const result = await controller.remove(1);

            expect(result).toEqual(mockUser);
            expect(userService.remove).toHaveBeenCalledWith(1);
        });
    });
});

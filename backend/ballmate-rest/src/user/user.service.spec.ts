import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
}));

describe('UserService', () => {
    let service: UserService;
    let prismaService: jest.Mocked<PrismaService>;

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

    beforeEach(async () => {
        const mockPrismaService = {
            user: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ============================================
    // CREATE USER TESTS
    // ============================================
    describe('create', () => {
        const createUserDto = {
            email: 'newuser@example.com',
            password: 'password123',
            fullName: 'New User',
            phoneNumber: '0987654321',
            role: 'PLAYER' as const,
        };

        it('should throw ConflictException if email already exists', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
            await expect(service.create(createUserDto)).rejects.toThrow('Email already exists');
        });

        it('should hash password before creating user', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockResolvedValue({
                id: 2,
                ...createUserDto,
                password: '$2b$10$hashedpassword',
            });

            await service.create(createUserDto);

            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
        });

        it('should create player relation for PLAYER role', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockResolvedValue({
                id: 2,
                ...createUserDto,
            });

            await service.create(createUserDto);

            expect(prismaService.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        player: { create: {} },
                    }),
                }),
            );
        });

        it('should create owner relation for FIELD_OWNER role', async () => {
            const ownerDto = { ...createUserDto, role: 'FIELD_OWNER' as const };
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockResolvedValue({
                id: 2,
                ...ownerDto,
            });

            await service.create(ownerDto);

            expect(prismaService.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        owner: { create: {} },
                    }),
                }),
            );
        });

        it('should create admin relation for ADMIN role', async () => {
            const adminDto = { ...createUserDto, role: 'ADMIN' as const };
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.user.create as jest.Mock).mockResolvedValue({
                id: 2,
                ...adminDto,
            });

            await service.create(adminDto);

            expect(prismaService.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        admin: { create: {} },
                    }),
                }),
            );
        });
    });

    // ============================================
    // FIND ALL TESTS
    // ============================================
    describe('findAll', () => {
        it('should return all active users', async () => {
            (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(prismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true },
                }),
            );
        });

        it('should not include password in returned data', async () => {
            (prismaService.user.findMany as jest.Mock).mockResolvedValue([
                { id: 1, email: 'test@test.com', fullName: 'Test' },
            ]);

            await service.findAll();

            expect(prismaService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    select: expect.not.objectContaining({ password: true }),
                }),
            );
        });
    });

    // ============================================
    // FIND ONE TESTS
    // ============================================
    describe('findOne', () => {
        it('should throw NotFoundException for non-existent user', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
            await expect(service.findOne(99999)).rejects.toThrow('User with ID 99999 not found');
        });

        it('should return user when found', async () => {
            const { password, ...userWithoutPassword } = mockUser;
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userWithoutPassword);

            const result = await service.findOne(1);

            expect(result.email).toBe(mockUser.email);
            expect(result).not.toHaveProperty('password');
        });
    });

    // ============================================
    // UPDATE TESTS
    // ============================================
    describe('update', () => {
        it('should throw NotFoundException for non-existent user', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.update(99999, { fullName: 'Updated' })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should update user successfully', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue({
                ...mockUser,
                fullName: 'Updated Name',
            });

            const result = await service.update(1, { fullName: 'Updated Name' });

            expect(result.fullName).toBe('Updated Name');
        });

        it('should hash password when updating password', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

            await service.update(1, { password: 'newpassword' });

            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
        });
    });

    // ============================================
    // REMOVE TESTS
    // ============================================
    describe('remove', () => {
        it('should throw NotFoundException for non-existent user', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.remove(99999)).rejects.toThrow(NotFoundException);
        });

        it('should delete user successfully', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.remove(1);

            expect(result).toBeDefined();
        });
    });

    // ============================================
    // FIND BY EMAIL TESTS
    // ============================================
    describe('findByEmail', () => {
        it('should return null for non-existent email', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.findByEmail('notfound@example.com');

            expect(result).toBeNull();
        });

        it('should return user for existing email', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });
    });
});

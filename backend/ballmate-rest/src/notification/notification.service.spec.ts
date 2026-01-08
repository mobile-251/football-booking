import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

describe('NotificationService', () => {
    let service: NotificationService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockNotification = {
        id: 1,
        userId: 1,
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đặt sân thành công',
        message: 'Test message',
        isRead: false,
        data: { bookingId: 1 },
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const mockPrismaService = {
            notification: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getNotifications', () => {
        it('should return all notifications for user', async () => {
            (prismaService.notification.findMany as jest.Mock).mockResolvedValue([mockNotification]);

            const result = await service.getNotifications(1);

            expect(result).toEqual([mockNotification]);
            expect(prismaService.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 1 },
                }),
            );
        });

        it('should filter unread only', async () => {
            (prismaService.notification.findMany as jest.Mock).mockResolvedValue([mockNotification]);

            await service.getNotifications(1, { unreadOnly: true });

            expect(prismaService.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 1, isRead: false },
                }),
            );
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count', async () => {
            (prismaService.notification.count as jest.Mock).mockResolvedValue(5);

            const result = await service.getUnreadCount(1);

            expect(result).toEqual({ unreadCount: 5 });
        });
    });

    describe('markAsRead', () => {
        it('should throw NotFoundException for non-existent notification', async () => {
            (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.markAsRead(1, 999)).rejects.toThrow(NotFoundException);
        });

        it('should mark notification as read', async () => {
            (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
            (prismaService.notification.update as jest.Mock).mockResolvedValue({
                ...mockNotification,
                isRead: true,
            });

            const result = await service.markAsRead(1, 1);

            expect(result.isRead).toBe(true);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            (prismaService.notification.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

            const result = await service.markAllAsRead(1);

            expect(result).toEqual({ message: 'All notifications marked as read' });
        });
    });

    describe('deleteNotification', () => {
        it('should throw NotFoundException for non-existent notification', async () => {
            (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.deleteNotification(1, 999)).rejects.toThrow(NotFoundException);
        });

        it('should delete notification', async () => {
            (prismaService.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
            (prismaService.notification.delete as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.deleteNotification(1, 1);

            expect(result).toEqual({ message: 'Notification deleted' });
        });
    });

    describe('createNotification', () => {
        it('should create notification', async () => {
            (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.createNotification({
                userId: 1,
                type: NotificationType.BOOKING_CONFIRMED,
                title: 'Test',
                message: 'Test message',
            });

            expect(result).toEqual(mockNotification);
        });
    });

    describe('createBookingNotification', () => {
        it('should create confirmed booking notification', async () => {
            (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            await service.createBookingNotification(1, 'confirmed', {
                fieldName: 'Test Field',
                date: '2026-01-15',
                time: '10:00',
                bookingId: 1,
            });

            expect(prismaService.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        type: NotificationType.BOOKING_CONFIRMED,
                    }),
                }),
            );
        });

        it('should create cancelled booking notification', async () => {
            (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            await service.createBookingNotification(1, 'cancelled', {
                fieldName: 'Test Field',
                date: '2026-01-15',
                time: '10:00',
                bookingId: 1,
            });

            expect(prismaService.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        type: NotificationType.BOOKING_CANCELLED,
                    }),
                }),
            );
        });
    });

    describe('createPaymentNotification', () => {
        it('should create success payment notification', async () => {
            (prismaService.notification.create as jest.Mock).mockResolvedValue(mockNotification);

            await service.createPaymentNotification(1, 'success', 300000, 1);

            expect(prismaService.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        type: NotificationType.PAYMENT_SUCCESS,
                    }),
                }),
            );
        });
    });
});

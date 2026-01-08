import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
    let controller: NotificationController;
    let notificationService: jest.Mocked<NotificationService>;

    const mockNotification = {
        id: 1,
        userId: 1,
        type: 'BOOKING_CONFIRMED',
        title: 'Đặt sân thành công',
        message: 'Test message',
        isRead: false,
        data: { bookingId: 1 },
        createdAt: new Date(),
    };

    const mockRequest = {
        user: { userId: 1, email: 'test@example.com' },
    };

    const mockNotificationService = {
        getNotifications: jest.fn(),
        getUnreadCount: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        deleteNotification: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationController],
            providers: [{ provide: NotificationService, useValue: mockNotificationService }],
        }).compile();

        controller = module.get<NotificationController>(NotificationController);
        notificationService = module.get(NotificationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getNotifications', () => {
        it('should return all notifications for user', async () => {
            mockNotificationService.getNotifications.mockResolvedValue([mockNotification]);

            const result = await controller.getNotifications(mockRequest);

            expect(result).toEqual([mockNotification]);
            expect(notificationService.getNotifications).toHaveBeenCalledWith(1, { unreadOnly: false });
        });

        it('should filter unread only when specified', async () => {
            mockNotificationService.getNotifications.mockResolvedValue([mockNotification]);

            await controller.getNotifications(mockRequest, 'true');

            expect(notificationService.getNotifications).toHaveBeenCalledWith(1, { unreadOnly: true });
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count', async () => {
            mockNotificationService.getUnreadCount.mockResolvedValue({ unreadCount: 5 });

            const result = await controller.getUnreadCount(mockRequest);

            expect(result).toEqual({ unreadCount: 5 });
            expect(notificationService.getUnreadCount).toHaveBeenCalledWith(1);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const readNotification = { ...mockNotification, isRead: true };
            mockNotificationService.markAsRead.mockResolvedValue(readNotification);

            const result = await controller.markAsRead(mockRequest, 1);

            expect(result.isRead).toBe(true);
            expect(notificationService.markAsRead).toHaveBeenCalledWith(1, 1);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            mockNotificationService.markAllAsRead.mockResolvedValue({ message: 'All notifications marked as read' });

            const result = await controller.markAllAsRead(mockRequest);

            expect(result.message).toBe('All notifications marked as read');
            expect(notificationService.markAllAsRead).toHaveBeenCalledWith(1);
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification', async () => {
            mockNotificationService.deleteNotification.mockResolvedValue({ message: 'Notification deleted' });

            const result = await controller.deleteNotification(mockRequest, 1);

            expect(result.message).toBe('Notification deleted');
            expect(notificationService.deleteNotification).toHaveBeenCalledWith(1, 1);
        });
    });
});

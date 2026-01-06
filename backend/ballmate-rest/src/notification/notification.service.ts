import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async getNotifications(userId: number, filter?: { unreadOnly?: boolean }) {
        const where: any = { userId };
        if (filter?.unreadOnly) {
            where.isRead = false;
        }

        return this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: number) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { unreadCount: count };
    }

    async markAsRead(userId: number, notificationId: number) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: number) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { message: 'All notifications marked as read' };
    }

    async deleteNotification(userId: number, notificationId: number) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        await this.prisma.notification.delete({
            where: { id: notificationId },
        });

        return { message: 'Notification deleted' };
    }

    // Helper method to create notifications (called from other services)
    async createNotification(data: {
        userId: number;
        type: NotificationType;
        title: string;
        message: string;
        data?: any;
    }) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data,
            },
        });
    }

    // Create booking-related notifications
    async createBookingNotification(
        userId: number,
        type: 'confirmed' | 'cancelled' | 'reminder',
        bookingData: { fieldName: string; date: string; time: string; bookingId: number },
    ) {
        const typeMap = {
            confirmed: {
                type: NotificationType.BOOKING_CONFIRMED,
                title: 'Đặt sân thành công',
                message: `${bookingData.fieldName} vào lúc ${bookingData.time} ngày ${bookingData.date}`,
            },
            cancelled: {
                type: NotificationType.BOOKING_CANCELLED,
                title: 'Đặt sân đã hủy',
                message: `Lịch đặt ${bookingData.fieldName} đã được hủy`,
            },
            reminder: {
                type: NotificationType.BOOKING_REMINDER,
                title: 'Nhắc nhở đặt sân',
                message: `Bạn có lịch đặt sân ${bookingData.fieldName} vào ${bookingData.time} hôm nay`,
            },
        };

        const config = typeMap[type];
        return this.createNotification({
            userId,
            type: config.type,
            title: config.title,
            message: config.message,
            data: { bookingId: bookingData.bookingId },
        });
    }

    // Create payment notification
    async createPaymentNotification(
        userId: number,
        status: 'success' | 'pending',
        amount: number,
        bookingId: number,
    ) {
        const typeMap = {
            success: {
                type: NotificationType.PAYMENT_SUCCESS,
                title: 'Thanh toán thành công',
                message: `Thanh toán ${amount.toLocaleString('vi-VN')}đ cho đơn đặt sân #${bookingId} đã được xác nhận`,
            },
            pending: {
                type: NotificationType.PAYMENT_PENDING,
                title: 'Chờ thanh toán',
                message: `Vui lòng thanh toán ${amount.toLocaleString('vi-VN')}đ cho đơn đặt sân #${bookingId}`,
            },
        };

        const config = typeMap[status];
        return this.createNotification({
            userId,
            type: config.type,
            title: config.title,
            message: config.message,
            data: { bookingId, amount },
        });
    }
}

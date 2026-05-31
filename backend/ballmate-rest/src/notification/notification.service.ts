import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BookingSource,
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  TopUpPurpose,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { coinToVnd, decimalToNumber } from '../common/coin.util';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: number, filter?: { unreadOnly?: boolean }) {
    const where: { userId: number; isRead?: boolean } = { userId };
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

  async createNotification(data: {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    data?: object;
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

  async createBookingNotification(
    userId: number,
    type: 'confirmed' | 'cancelled' | 'reminder',
    bookingData: { fieldName: string; date: string; time: string; bookingId: number },
  ) {
    const typeMap = {
      confirmed: {
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đặt sân đã được duyệt',
        message: `${bookingData.fieldName} — ${bookingData.time} ngày ${bookingData.date}. Chủ sân đã xác nhận lịch của bạn.`,
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

  private formatSchedule(start: Date, end: Date) {
    const date = start.toLocaleDateString('vi-VN');
    const fmt = (d: Date) =>
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { date, time: `${fmt(start)} – ${fmt(end)}` };
  }

  private async getVenueStaffUserIds(venueId: number): Promise<number[]> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        owner: { select: { userId: true } },
        venueManagers: {
          where: { isActive: true, deletedAt: null },
          select: { userId: true },
        },
      },
    });

    const ids = new Set<number>();
    if (venue?.owner?.userId) ids.add(venue.owner.userId);
    for (const vm of venue?.venueManagers ?? []) {
      ids.add(vm.userId);
    }
    return [...ids];
  }

  private async notifyVenueStaff(
    venueId: number,
    payload: {
      type: NotificationType;
      title: string;
      message: string;
      data?: object;
    },
  ) {
    const userIds = await this.getVenueStaffUserIds(venueId);
    await Promise.all(
      userIds.map((userId) =>
        this.createNotification({ userId, ...payload }).catch((err) => {
          this.logger.warn(`Notify user ${userId} failed: ${String(err)}`);
        }),
      ),
    );
  }

  /** Sau khi tạo booking (app / walk-in). */
  async dispatchBookingCreated(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        field: { include: { venue: { select: { id: true } } } },
        player: { include: { user: { select: { id: true } } } },
      },
    });
    if (!booking?.field?.venue) return;

    const { date, time } = this.formatSchedule(
      booking.startTime,
      booking.endTime,
    );
    const customer = booking.customerName;
    const fieldName = booking.field.name;
    const venueId = booking.field.venue.id;
    const meta = { bookingId: booking.id, venueId, fieldId: booking.fieldId };

    const awaitingCk =
      booking.payment?.method === PaymentMethod.BANK_TRANSFER &&
      booking.payment.status === PaymentStatus.PENDING;

    if (booking.source === BookingSource.WEB_WALK_IN) {
      if (booking.status === BookingStatus.CONFIRMED) {
        await this.notifyVenueStaff(venueId, {
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Đặt sân mới tại quầy',
          message: `${customer} — ${fieldName}, ${time} ngày ${date}. Đã xác nhận (thanh toán tại sân).`,
          data: meta,
        });
      } else if (awaitingCk) {
        await this.notifyVenueStaff(venueId, {
          type: NotificationType.BOOKING_PENDING,
          title: 'Đặt sân mới — chờ chuyển khoản',
          message: `${customer} — ${fieldName}, ${time} ngày ${date}. Khách chưa chuyển khoản.`,
          data: meta,
        });
      }
      return;
    }

    if (booking.status === BookingStatus.PENDING) {
      await this.notifyVenueStaff(venueId, {
        type: NotificationType.BOOKING_PENDING,
        title: 'Có lượt đặt cần duyệt',
        message: `${customer} — ${fieldName}, ${time} ngày ${date}. Vui lòng duyệt booking trên lịch sân.`,
        data: meta,
      });

      if (booking.player?.user) {
        await this.createNotification({
          userId: booking.player.user.id,
          type: NotificationType.BOOKING_PENDING,
          title: 'Đặt sân thành công',
          message: `${fieldName}, ${time} ngày ${date}. Vui lòng chờ chủ sân duyệt.`,
          data: meta,
        });
      }
    }
  }

  /** Sau khi booking chuyển CONFIRMED (duyệt thủ công hoặc walk-in CK). */
  async dispatchBookingConfirmed(
    bookingId: number,
    options?: { walkInBankPaid?: boolean },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        field: { include: { venue: { select: { id: true } } } },
        player: { include: { user: { select: { id: true } } } },
      },
    });
    if (!booking?.field?.venue) return;

    const { date, time } = this.formatSchedule(
      booking.startTime,
      booking.endTime,
    );
    const fieldName = booking.field.name;
    const meta = { bookingId: booking.id, venueId: booking.field.venue.id };

    if (booking.player?.user) {
      await this.createBookingNotification(
        booking.player.user.id,
        'confirmed',
        { fieldName, date, time, bookingId: booking.id },
      );
    }

    if (options?.walkInBankPaid) {
      await this.notifyVenueStaff(booking.field.venue.id, {
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đã nhận chuyển khoản',
        message: `${booking.customerName} — ${fieldName}, ${time} ngày ${date}. Booking đã xác nhận.`,
        data: meta,
      });
    }
  }

  /** Khách nạp coin (SePay) liên quan đặt sân / mua gói tại sân. */
  async dispatchVenueTopUpPaid(orderId: number) {
    const order = await this.prisma.topUpOrder.findUnique({
      where: { id: orderId },
      include: {
        player: { include: { user: { select: { fullName: true } } } },
        hold: { select: { fieldId: true } },
      },
    });
    if (!order?.paidAt) return;
    if (
      order.purpose !== TopUpPurpose.BOOKING_JIT &&
      order.purpose !== TopUpPurpose.COMBO_JIT
    ) {
      return;
    }

    let venueId: number | null = null;
    let context = 'đặt sân';

    if (order.comboPackageId) {
      const pkg = await this.prisma.comboPackage.findUnique({
        where: { id: order.comboPackageId },
        select: { venueId: true, name: true },
      });
      if (pkg) {
        venueId = pkg.venueId;
        context = `mua gói "${pkg.name}"`;
      }
    } else if (order.hold?.fieldId) {
      const field = await this.prisma.field.findUnique({
        where: { id: order.hold.fieldId },
        select: { venueId: true },
      });
      venueId = field?.venueId ?? null;
      context = 'hoàn tất đặt sân';
    }

    if (!venueId) return;

    const name =
      order.player?.user?.fullName?.trim() || 'Khách';
    await this.notifyVenueStaff(venueId, {
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Khách đã nạp coin',
      message: `${name} chuyển ${order.priceVnd.toLocaleString('vi-VN')}đ — ${context}.`,
      data: {
        topUpOrderId: order.id,
        venueId,
        amountVnd: order.priceVnd,
        purpose: order.purpose,
      },
    });
  }

  /** Mua gói combo bằng số dư ví (không qua nạp JIT). */
  async dispatchVenueComboPurchased(playerComboId: number) {
    const pc = await this.prisma.playerCombo.findUnique({
      where: { id: playerComboId },
      include: {
        comboPackage: { select: { venueId: true, name: true, priceCoin: true } },
        player: { include: { user: { select: { fullName: true } } } },
      },
    });
    if (!pc?.comboPackage) return;

    const priceCoin = decimalToNumber(pc.comboPackage.priceCoin);
    const name = pc.player?.user?.fullName?.trim() || 'Khách';
    await this.notifyVenueStaff(pc.comboPackage.venueId, {
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Mua gói combo',
      message: `${name} mua "${pc.comboPackage.name}" — ${priceCoin} coin (${coinToVnd(priceCoin).toLocaleString('vi-VN')}đ).`,
      data: { playerComboId: pc.id, venueId: pc.comboPackage.venueId },
    });
  }

  /** Đặt sân app bằng coin hoặc gói combo — báo chủ sân. */
  async dispatchVenueCoinBooking(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        comboUsage: true,
        field: { include: { venue: { select: { id: true } } } },
      },
    });
    if (!booking?.field?.venue) return;
    if (booking.source !== BookingSource.MOBILE_APP) return;
    if (booking.status !== BookingStatus.CONFIRMED) return;

    const { date, time } = this.formatSchedule(
      booking.startTime,
      booking.endTime,
    );
    const name = booking.customerName;
    const fieldName = booking.field.name;
    const venueId = booking.field.venue.id;
    const meta = { bookingId: booking.id, venueId };

    if (booking.comboUsage) {
      await this.notifyVenueStaff(venueId, {
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đặt sân bằng gói combo',
        message: `${name} — ${fieldName}, ${time} ngày ${date}. Trừ 1 lượt gói (không thu thêm tiền sân).`,
        data: meta,
      });
      return;
    }

    const totalCoin = decimalToNumber(booking.totalCoin ?? 0);
    if (totalCoin > 0) {
      await this.notifyVenueStaff(venueId, {
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đặt sân thanh toán coin',
        message: `${name} — ${fieldName}, ${time} ngày ${date}. Thu ${totalCoin} coin (${coinToVnd(totalCoin).toLocaleString('vi-VN')}đ).`,
        data: meta,
      });
    }
  }
}

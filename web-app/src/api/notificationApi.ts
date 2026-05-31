import AxiosClient from './AxiosClient';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: { bookingId?: number; venueId?: number };
  isRead: boolean;
  createdAt: string;
}

const notificationApi = {
  getAll: (unreadOnly?: boolean) =>
    AxiosClient.get('/notifications', {
      params: unreadOnly ? { unreadOnly: 'true' } : undefined,
    }) as Promise<AppNotification[]>,

  getUnreadCount: () =>
    AxiosClient.get('/notifications/unread-count') as Promise<{
      unreadCount: number;
    }>,

  markAsRead: (id: number) =>
    AxiosClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => AxiosClient.patch('/notifications/read-all'),

  delete: (id: number) => AxiosClient.delete(`/notifications/${id}`),
};

export default notificationApi;

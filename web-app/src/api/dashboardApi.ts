import AxiosClient from './AxiosClient';

export interface DashboardStats {
  monthlyRevenue: number;
  monthlyRevenueChangePercent: number;
  todayBookings: number;
  todayBookingsChange: number;
  occupancyRate: number;
  occupancyChangePercent: number;
  unreadNotifications: number;
}

export interface RevenueChartPoint {
  date: string;
  label: string;
  revenue: number;
}

export type ScheduleSlotStatus = 'empty' | 'booked' | 'maintenance';

export interface TodayScheduleSlot {
  hour: string;
  bookingCount: number;
  status: ScheduleSlotStatus;
  note?: string;
}

export interface RecentBookingItem {
  id: number;
  customerName: string;
  fieldName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
}

export interface VenueDashboardData {
  stats: DashboardStats;
  revenueChart: RevenueChartPoint[];
  todaySchedule: TodayScheduleSlot[];
  recentBookings: RecentBookingItem[];
}

const dashboardApi = {
  getVenueDashboard: (venueId: number): Promise<VenueDashboardData> =>
    AxiosClient.get(`/venues/${venueId}/dashboard`) as Promise<VenueDashboardData>,
};

export default dashboardApi;

import AxiosClient from './AxiosClient';

export interface DashboardStats {
  monthlyRevenue: number;
  monthlyBookingRevenue: number;
  monthlyComboRevenue: number;
  monthlyRevenueChangePercent: number;
  comboBookingsThisMonth: number;
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
  bookingRevenue?: number;
  comboRevenue?: number;
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
  paymentLabel: string;
  usedCombo?: boolean;
}

export type RecentActivityType = 'top_up' | 'combo_purchase' | 'booking';

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  title: string;
  subtitle: string;
  amountVnd: number;
  createdAt: string;
}

export interface VenueDashboardData {
  stats: DashboardStats;
  revenueChart: RevenueChartPoint[];
  todaySchedule: TodayScheduleSlot[];
  recentActivity: RecentActivityItem[];
  recentBookings: RecentBookingItem[];
}

const dashboardApi = {
  getVenueDashboard: (venueId: number): Promise<VenueDashboardData> =>
    AxiosClient.get(`/venues/${venueId}/dashboard`) as Promise<VenueDashboardData>,
};

export default dashboardApi;

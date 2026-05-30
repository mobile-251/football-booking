import AxiosClient from './AxiosClient';
// import { BookingStatus } from './types';

export interface CreateBookingDto {
    fieldId: number;
    playerId: number;
    customerName: string;
    customerPhone: string;
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    totalPrice: number;
    note?: string;
}

export interface UpdateBookingDto {
    startTime?: string;
    endTime?: string;
    totalPrice?: number;
    status?: string | any;
    note?: string;
}

export interface CreateWalkInBookingDto {
    fieldId: number;
    date: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    note?: string;
    paymentMethod?: 'CASH' | 'BANK_TRANSFER';
}

export interface WalkInBankTransferPayment {
    method: string;
    status: string;
    amount: number;
    sepayPaymentCode: string;
    qrImageUrl: string;
    expiresAt: string;
}

export interface WalkInBookingResponse {
    booking: {
        id: number;
        bookingCode: string;
        status: string;
        totalPrice: number;
        startTime: string;
        endTime: string;
    };
    payment?: WalkInBankTransferPayment | null;
}

export interface BookingPaymentStatus {
    bookingId: number;
    bookingStatus: string;
    paymentStatus: string;
    paidAt?: string;
    expired?: boolean;
    qrImageUrl?: string;
    sepayPaymentCode?: string;
    amount?: number;
    expiresAt?: string;
}

const bookingApi = {
    create: (data: CreateBookingDto) => {
        return AxiosClient.post('/bookings', data);
    },
    getAll: (params?: { playerId?: number; fieldId?: number; venueId?: number; status?: string }) => {
        return AxiosClient.get('/bookings', { params });
    },
    getOne: (id: number) => {
        return AxiosClient.get(`/bookings/${id}`);
    },
    update: (id: number, data: UpdateBookingDto) => {
        return AxiosClient.patch(`/bookings/${id}`, data);
    },
    confirm: (id: number) => {
        return AxiosClient.patch(`/bookings/${id}/confirm`);
    },
    cancel: (id: number) => {
        return AxiosClient.patch(`/bookings/${id}/cancel`);
    },
    complete: (id: number, data: { bookingCode: string }) => {
        return AxiosClient.patch(`/bookings/${id}/complete`, data);
    },
    remove: (id: number) => {
        return AxiosClient.delete(`/bookings/${id}`);
    },
    createWalkIn: (venueId: number, data: CreateWalkInBookingDto) => {
        return AxiosClient.post(`/venues/${venueId}/walk-in-bookings`, data) as Promise<WalkInBookingResponse>;
    },
    getPaymentStatus: (bookingId: number) => {
        return AxiosClient.get(`/bookings/${bookingId}/payment-status`) as Promise<BookingPaymentStatus>;
    },
};

export default bookingApi;

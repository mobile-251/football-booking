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
    }
};

export default bookingApi;

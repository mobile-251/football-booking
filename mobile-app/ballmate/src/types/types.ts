// Type definitions for BallMate app

export type UserRole = 'ADMIN' | 'FIELD_OWNER' | 'PLAYER';

export interface User {
    id: number;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: UserRole;
    avatarUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    player?: {
        id: number;
        userId: number;
    };
}

export interface Venue {
    id: number;
    name: string;
    description?: string;
    address: string;
    city: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    openTime: string;
    closeTime: string;
    phoneNumber?: string;
    facilities: string[];
    images: string[];
    ownerId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    fields?: Field[];
}

export type FieldType = 'FIELD_5VS5' | 'FIELD_7VS7' | 'FIELD_11VS11';

export interface Field {
    id: number;
    name: string;
    venueId: number;
    fieldType: FieldType;
    pricePerHour: number;
    description?: string;
    images: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    venue?: Venue;
    reviews?: Review[];
}

// Booking flow - Step 2: Field Type Pricing Summary
export interface FieldTypePricingSummary {
    fieldType: FieldType;
    minPrice: number;
    availableFieldIds: number[];
}

// Booking flow - Step 3: Field Slot Info  
export interface TimeSlotInfo {
    startTime: string;
    endTime: string;
    price: number;
    isPeakHour: boolean;
    isAvailable: boolean;
}

export interface FieldSlotInfo {
    fieldId: number;
    fieldName: string;
    slots: TimeSlotInfo[];
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
    id: number;
    bookingCode: string; // BM + 6 chars (ví dụ: BM1A2B3C)
    fieldId: number;
    playerId: number;
    startTime: string;
    endTime: string;
    totalPrice: number;
    status: BookingStatus;
    note?: string;
    createdAt: string;
    updatedAt: string;
    field?: Field;
    payment?: Payment;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';

export interface Payment {
    id: number;
    bookingId: number;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Review {
    id: number;
    fieldId: number;
    playerId: number;
    rating: number;
    comment?: string;
    createdAt: string;
    updatedAt: string;
}

// Field Pricing for venue detail
export type DayType = 'WEEKDAY' | 'WEEKEND';

export interface FieldPricing {
    id: number;
    fieldId: number;
    dayType: DayType;
    startTime: string;
    endTime: string;
    price: number;
}

// Field with pricing and stats for VenueDetail
export interface FieldWithPricing extends Omit<Field, 'pricePerHour' | 'description' | 'images' | 'venue' | 'reviews'> {
    pricings: FieldPricing[];
    reviewCount: number;
    bookingCount: number;
}

// Venue Detail response from API
export interface VenueDetail extends Venue {
    owner: {
        id: number;
        user: {
            id: number;
            fullName: string;
            phoneNumber?: string;
            email: string;
        };
    };
    fieldsPricings: FieldWithPricing[];
    minPrice: number;
    totalBookings: number;
    averageRating: number;
    totalReviews: number;
    activeFieldCount: number;
}

// API Response types
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

// Filter types
export interface FieldFilter {
    city?: string;
    fieldType?: FieldType;
    maxPrice?: number;
}

// Time slot for booking
export type SlotStatus = 'available' | 'booked' | 'selected' | 'peak';

export interface TimeSlot {
    time: string; // "08:00"
    price: number;
    status: SlotStatus;
    isPeakHour?: boolean;
}

export interface AvailabilityResponse {
    fieldId: number;
    date: string;
    slots: TimeSlot[];
}

export interface SelectedSlot {
    date: string;
    fieldId: number;
    fieldName: string;
    startTime: string;
    endTime: string;
    price: number;
}

export interface BookingFormData {
    fullName: string;
    phoneNumber: string;
    note?: string;
    paymentMethod: PaymentMethod;
    selectedSlots: SelectedSlot[];
}

export interface CreatePaymentDto {
    bookingId: number;
    amount: number;
    method: PaymentMethod;
}

// Field type labels in Vietnamese
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    FIELD_5VS5: 'Sân 5',
    FIELD_7VS7: 'Sân 7',
    FIELD_11VS11: 'Sân 11',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Thanh toán tại sân',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
    MOMO: 'Ví MoMo',
    VNPAY: 'VNPay',
};

import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, Field, Venue, Booking, Review, FieldFilter, ApiError, User } from '../types/types';
import { Config } from '../config/environment';

const API_BASE_URL = Config.API_URL;

// Debug log to show which API URL is being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('📱 App Environment:', Config.APP_ENV);

class ApiService {
	private client: AxiosInstance;
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	public currentUser: User | null = null;

	constructor() {
		console.log('🚀 Initializing API Service with URL:', API_BASE_URL);
		this.client = axios.create({
			baseURL: API_BASE_URL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Add auth interceptor
		this.client.interceptors.request.use((config) => {
			if (this.accessToken) {
				config.headers.Authorization = `Bearer ${this.accessToken}`;
			}
			return config;
		});

		// Add error interceptor
		this.client.interceptors.response.use(
			(response) => response,
			(error: AxiosError<ApiError>) => {
				console.error('API Error:', error.response?.data || error.message);
				return Promise.reject(error);
			}
		);
	}

	setAccessToken(token: string | null) {
		this.accessToken = token;
	}

	setRefreshToken(token: string | null) {
		this.refreshToken = token;
	}

	// Auth endpoints
	async login(email: string, password: string): Promise<AuthResponse> {
		console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
		console.log('Email:', email);
		try {
			const response = await this.client.post<any>('/auth/login', { email, password });
			console.log('Login successful!');
			console.log('Response data:', JSON.stringify(response.data));

			const accessToken = response.data.accessToken || response.data.access_token;
			const refreshToken = response.data.refreshToken || response.data.refresh_token;

			this.accessToken = accessToken;
			this.refreshToken = refreshToken;
			this.currentUser = response.data.user;

			return {
				accessToken,
				refreshToken,
				user: response.data.user,
			};
		} catch (error: any) {
			console.log('Login failed!');
			console.log('Error details:', error.message);
			console.log('Error response:', error.response?.data);
			console.log('Error status:', error.response?.status);
			throw error;
		}
	}

	async register(data: {
		email: string;
		password: string;
		fullName: string;
		phoneNumber?: string;
	}): Promise<AuthResponse> {
		const response = await this.client.post<AuthResponse>('/auth/register', data);
		this.accessToken = response.data.accessToken;
		this.refreshToken = response.data.refreshToken;
		return response.data;
	}

	async refreshAccessToken(): Promise<AuthResponse> {
		const response = await this.client.post<AuthResponse>(
			'/auth/refresh',
			{},
			{
				headers: { Authorization: `Bearer ${this.refreshToken}` },
			}
		);
		this.accessToken = response.data.accessToken;
		return response.data;
	}

	async getProfile(): Promise<User> {
		const response = await this.client.get<User>('/auth/profile');
		return response.data;
	}

	// User endpoints
	async getUsers(): Promise<User[]> {
		const response = await this.client.get<User[]>('/users');
		return response.data;
	}

	async getUser(id: number): Promise<User> {
		const response = await this.client.get<User>(`/users/${id}`);
		return response.data;
	}

	async updateUser(id: number, data: Partial<User>): Promise<User> {
		const response = await this.client.patch<User>(`/users/${id}`, data);
		return response.data;
	}

	async deleteUser(id: number): Promise<void> {
		await this.client.delete(`/users/${id}`);
	}

	// Venue endpoints
	async getVenues(city?: string): Promise<Venue[]> {
		const response = await this.client.get<Venue[]>('/venues', { params: { city } });
		return response.data;
	}

	async getVenue(id: number): Promise<Venue> {
		const response = await this.client.get<Venue>(`/venues/${id}`);
		return response.data;
	}

	// Field endpoints
	async getFields(filter?: FieldFilter): Promise<Field[]> {
		const response = await this.client.get<Field[]>('/fields', { params: filter });
		return response.data;
	}

	async getField(id: number): Promise<Field> {
		const response = await this.client.get<Field>(`/fields/${id}`);
		return response.data;
	}

	// Booking endpoints
	async getBookings(params?: { playerId?: number; fieldId?: number; status?: string }): Promise<Booking[]> {
		const response = await this.client.get<Booking[]>('/bookings', { params });
		return response.data;
	}

	async createBooking(data: {
		fieldId: number;
		playerId: number;
		startTime: string;
		endTime: string;
		totalPrice: number;
		note?: string;
	}): Promise<Booking> {
		const response = await this.client.post<Booking>('/bookings', data);
		return response.data;
	}

	async getFieldAvailability(fieldId: number, date: string): Promise<any> {
		const response = await this.client.get(`/bookings/field/${fieldId}/availability`, { params: { date } });
		return response.data;
	}

	async getBooking(id: number): Promise<Booking> {
		const response = await this.client.get<Booking>(`/bookings/${id}`);
		return response.data;
	}

	async updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
		const response = await this.client.patch<Booking>(`/bookings/${id}`, data);
		return response.data;
	}

	async confirmBooking(id: number): Promise<Booking> {
		const response = await this.client.patch<Booking>(`/bookings/${id}/confirm`);
		return response.data;
	}

	async cancelBooking(id: number): Promise<Booking> {
		const response = await this.client.patch<Booking>(`/bookings/${id}/cancel`);
		return response.data;
	}

	async deleteBooking(id: number): Promise<void> {
		await this.client.delete(`/bookings/${id}`);
	}

	// Payment endpoints
	async createPayment(data: { bookingId: number; amount: number; method: string }): Promise<any> {
		const response = await this.client.post('/payments', data);
		return response.data;
	}

	async getPayments(status?: string): Promise<any[]> {
		const response = await this.client.get('/payments', { params: { status } });
		return response.data;
	}

	async getPayment(id: number): Promise<any> {
		const response = await this.client.get(`/payments/${id}`);
		return response.data;
	}

	async confirmPayment(id: number): Promise<any> {
		const response = await this.client.patch(`/payments/${id}/confirm`);
		return response.data;
	}

	async getPaymentByBookingId(bookingId: number): Promise<any> {
		const response = await this.client.get(`/payments/booking/${bookingId}`);
		return response.data;
	}

	// Review endpoints
	async getReviews(fieldId?: number): Promise<Review[]> {
		const response = await this.client.get<Review[]>('/reviews', { params: { fieldId } });
		return response.data;
	}

	async getReview(id: number): Promise<Review> {
		const response = await this.client.get<Review>(`/reviews/${id}`);
		return response.data;
	}

	async createReview(data: { fieldId: number; playerId: number; rating: number; comment?: string }): Promise<Review> {
		const response = await this.client.post<Review>('/reviews', data);
		return response.data;
	}

	async updateReview(id: number, data: Partial<Review>): Promise<Review> {
		const response = await this.client.patch<Review>(`/reviews/${id}`, data);
		return response.data;
	}

	async deleteReview(id: number): Promise<void> {
		await this.client.delete(`/reviews/${id}`);
	}

	// Logout
	logout() {
		this.accessToken = null;
		this.refreshToken = null;
	}
}

export const api = new ApiService();
export default api;

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
			console.log('[API] Request to:', config.url, 'Token exists:', !!this.accessToken);

			// List of public endpoints that don't need access token
			const publicEndpoints = ['/auth/login', '/auth/register'];
			const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

			if (this.accessToken && !isPublicEndpoint) {
				config.headers.Authorization = `Bearer ${this.accessToken}`;
				console.log('[API] Added Authorization header');
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
		console.log('[API] setAccessToken called, token length:', token?.length);
		this.accessToken = token;
	}

	setRefreshToken(token: string | null) {
		this.refreshToken = token;
	}

	// Check if user is authenticated
	get isAuthenticated(): boolean {
		return !!this.accessToken;
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
				access_token: accessToken,
				refresh_token: refreshToken,
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
		this.accessToken = response.data.access_token;
		this.refreshToken = response.data.refresh_token;
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
		this.accessToken = response.data.access_token;
		return response.data;
	}

	async getProfile(): Promise<User> {
		const response = await this.client.get<User>('/auth/profile');
		return response.data;
	}

	async updateProfile(data: { fullName?: string; phoneNumber?: string }): Promise<User> {
		if (!this.currentUser) {
			throw new Error('No user logged in');
		}
		const response = await this.client.patch<User>(`/users/${this.currentUser.id}`, data);
		// Update cached user data
		this.currentUser = { ...this.currentUser, ...response.data };
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

	async getFieldStats(): Promise<{ total: number; byType: Record<string, number>; minPrice: number }> {
		const response = await this.client.get('/fields/stats');
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

	// Favorites endpoints
	async getFavorites(): Promise<any[]> {
		const response = await this.client.get('/favorites');
		return response.data;
	}

	async addFavorite(fieldId: number): Promise<any> {
		const response = await this.client.post(`/favorites/${fieldId}`);
		return response.data;
	}

	async removeFavorite(fieldId: number): Promise<void> {
		await this.client.delete(`/favorites/${fieldId}`);
	}

	async checkFavorite(fieldId: number): Promise<{ isFavorite: boolean }> {
		const response = await this.client.get(`/favorites/${fieldId}/check`);
		return response.data;
	}

	async toggleFavorite(fieldId: number): Promise<{ isFavorite: boolean; message: string }> {
		const response = await this.client.post(`/favorites/${fieldId}/toggle`);
		return response.data;
	}

	// Notifications endpoints
	async getNotifications(unreadOnly?: boolean): Promise<any[]> {
		const response = await this.client.get('/notifications', {
			params: { unreadOnly: unreadOnly ? 'true' : undefined },
		});
		return response.data;
	}

	async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
		const response = await this.client.get('/notifications/unread-count');
		return response.data;
	}

	async markNotificationAsRead(id: number): Promise<any> {
		const response = await this.client.patch(`/notifications/${id}/read`);
		return response.data;
	}

	async markAllNotificationsAsRead(): Promise<{ message: string }> {
		const response = await this.client.patch('/notifications/read-all');
		return response.data;
	}

	async deleteNotification(id: number): Promise<void> {
		await this.client.delete(`/notifications/${id}`);
	}

	// Messaging endpoints
	async getConversations(): Promise<any[]> {
		const response = await this.client.get('/conversations');
		return response.data;
	}

	async getMessages(conversationId: number): Promise<any[]> {
		const response = await this.client.get(`/conversations/${conversationId}/messages`);
		return response.data;
	}

	async sendMessage(conversationId: number, content: string): Promise<any> {
		const response = await this.client.post(`/conversations/${conversationId}/messages`, { content });
		return response.data;
	}

	async startConversation(fieldId: number, message?: string): Promise<any> {
		const response = await this.client.post('/conversations/start', { fieldId, message });
		return response.data;
	}

	// Logout
	logout() {
		this.accessToken = null;
		this.refreshToken = null;
		this.currentUser = null;
	}
}

export const api = new ApiService();
export default api;

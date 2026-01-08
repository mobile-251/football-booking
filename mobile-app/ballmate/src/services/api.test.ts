/**
 * @file api.test.ts
 * @description Unit tests for src/services/api.ts (ApiService)
 * Coverage target: ≥60% for core API logic
 *
 * Tests cover:
 * - Token management (setAccessToken, setRefreshToken, isAuthenticated)
 * - Auth endpoints (login, register, refreshAccessToken, logout)
 * - User endpoints (getProfile, updateProfile, getUsers, getUser)
 * - Venue endpoints (getVenues, getVenue, getFieldTypePricing)
 * - Field endpoints (getFields, getField, getFieldPricing)
 * - Booking endpoints (getBookings, createBooking, confirmBooking, cancelBooking)
 * - Payment, Review, Notification, and Message endpoints
 * - Error handling
 */

// Create mockClient before jest.mock
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
        delete: mockDelete,
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    })),
}));

// Mock Config
jest.mock('../config/environment', () => ({
    Config: {
        API_URL: 'http://test-api.com',
        APP_ENV: 'test',
    },
}));

// Import after mocks
import { api } from './api';
import { FieldFilter, FieldType } from '../types/types';

describe('ApiService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset api state
        api.setAccessToken(null);
        api.setRefreshToken(null);
        api.currentUser = null;
    });

    describe('Token Management', () => {
        it('should set access token', () => {
            api.setAccessToken('test-token');
            expect(api.isAuthenticated).toBe(true);
        });

        it('should clear access token', () => {
            api.setAccessToken('test-token');
            api.setAccessToken(null);
            expect(api.isAuthenticated).toBe(false);
        });

        it('should set refresh token', () => {
            api.setRefreshToken('refresh-token');
            // No direct getter, but should not throw
            expect(true).toBe(true);
        });

        it('should return false for isAuthenticated when no token', () => {
            api.setAccessToken(null);
            expect(api.isAuthenticated).toBe(false);
        });
    });

    describe('logout', () => {
        it('should clear all tokens and user', () => {
            api.setAccessToken('token');
            api.setRefreshToken('refresh');
            api.currentUser = { id: 1, email: 'test@test.com' } as any;

            api.logout();

            expect(api.isAuthenticated).toBe(false);
            expect(api.currentUser).toBeNull();
        });
    });

    describe('Auth Endpoints', () => {
        describe('login', () => {
            it('should login successfully and store tokens', async () => {
                const mockResponse = {
                    data: {
                        accessToken: 'new-access-token',
                        refreshToken: 'new-refresh-token',
                        user: { id: 1, email: 'test@test.com', fullName: 'Test User' },
                    },
                };
                mockPost.mockResolvedValueOnce(mockResponse);

                const result = await api.login('test@test.com', 'password123');

                expect(mockPost).toHaveBeenCalledWith('/auth/login', {
                    email: 'test@test.com',
                    password: 'password123',
                });
                expect(result.access_token).toBe('new-access-token');
                expect(result.refresh_token).toBe('new-refresh-token');
                expect(result.user).toEqual(mockResponse.data.user);
                expect(api.isAuthenticated).toBe(true);
            });

            it('should handle login with snake_case tokens', async () => {
                const mockResponse = {
                    data: {
                        access_token: 'snake-access-token',
                        refresh_token: 'snake-refresh-token',
                        user: { id: 2, email: 'snake@test.com' },
                    },
                };
                mockPost.mockResolvedValueOnce(mockResponse);

                const result = await api.login('snake@test.com', 'password');

                expect(result.access_token).toBe('snake-access-token');
                expect(api.isAuthenticated).toBe(true);
            });

            it('should throw error on login failure', async () => {
                const error = new Error('Invalid credentials');
                mockPost.mockRejectedValueOnce(error);

                await expect(api.login('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
            });
        });

        describe('register', () => {
            it('should register successfully', async () => {
                const mockResponse = {
                    data: {
                        access_token: 'new-access',
                        refresh_token: 'new-refresh',
                        user: { id: 3, email: 'new@test.com' },
                    },
                };
                mockPost.mockResolvedValueOnce(mockResponse);

                const result = await api.register({
                    email: 'new@test.com',
                    password: 'password123',
                    fullName: 'New User',
                    phoneNumber: '0123456789',
                });

                expect(mockPost).toHaveBeenCalledWith('/auth/register', {
                    email: 'new@test.com',
                    password: 'password123',
                    fullName: 'New User',
                    phoneNumber: '0123456789',
                });
                expect(result).toEqual(mockResponse.data);
            });
        });

        describe('refreshAccessToken', () => {
            it('should refresh token successfully', async () => {
                api.setRefreshToken('old-refresh');
                const mockResponse = {
                    data: {
                        access_token: 'refreshed-token',
                        refresh_token: 'new-refresh',
                    },
                };
                mockPost.mockResolvedValueOnce(mockResponse);

                const result = await api.refreshAccessToken();

                expect(mockPost).toHaveBeenCalledWith('/auth/refresh', {}, expect.any(Object));
                expect(result.access_token).toBe('refreshed-token');
            });
        });

        describe('getProfile', () => {
            it('should get user profile', async () => {
                const mockUser = { id: 1, email: 'test@test.com', fullName: 'Test' };
                mockGet.mockResolvedValueOnce({ data: mockUser });

                const result = await api.getProfile();

                expect(mockGet).toHaveBeenCalledWith('/auth/profile');
                expect(result).toEqual(mockUser);
            });
        });

        describe('updateProfile', () => {
            it('should throw error when no user logged in', async () => {
                api.currentUser = null;
                await expect(api.updateProfile({ fullName: 'New Name' })).rejects.toThrow(
                    'No user logged in'
                );
            });

            it('should update profile when user is logged in', async () => {
                api.currentUser = { id: 1, email: 'test@test.com' } as any;
                const updatedUser = { id: 1, email: 'test@test.com', fullName: 'Updated Name' };
                mockPatch.mockResolvedValueOnce({ data: updatedUser });

                const result = await api.updateProfile({ fullName: 'Updated Name' });

                expect(mockPatch).toHaveBeenCalledWith('/users/1', { fullName: 'Updated Name' });
                expect(result).toEqual(updatedUser);
            });
        });
    });

    describe('User Endpoints', () => {
        it('should get all users', async () => {
            const mockUsers = [{ id: 1 }, { id: 2 }];
            mockGet.mockResolvedValueOnce({ data: mockUsers });

            const result = await api.getUsers();

            expect(mockGet).toHaveBeenCalledWith('/users');
            expect(result).toEqual(mockUsers);
        });

        it('should get single user by id', async () => {
            const mockUser = { id: 1, email: 'test@test.com' };
            mockGet.mockResolvedValueOnce({ data: mockUser });

            const result = await api.getUser(1);

            expect(mockGet).toHaveBeenCalledWith('/users/1');
            expect(result).toEqual(mockUser);
        });

        it('should update user', async () => {
            const updatedUser = { id: 1, fullName: 'Updated' };
            mockPatch.mockResolvedValueOnce({ data: updatedUser });

            const result = await api.updateUser(1, { fullName: 'Updated' } as any);

            expect(mockPatch).toHaveBeenCalledWith('/users/1', { fullName: 'Updated' });
            expect(result).toEqual(updatedUser);
        });

        it('should delete user', async () => {
            mockDelete.mockResolvedValueOnce({});

            await api.deleteUser(1);

            expect(mockDelete).toHaveBeenCalledWith('/users/1');
        });
    });

    describe('Venue Endpoints', () => {
        it('should get all venues', async () => {
            const mockVenues = [{ id: 1, name: 'Venue 1' }];
            mockGet.mockResolvedValueOnce({ data: mockVenues });

            const result = await api.getVenues();

            expect(mockGet).toHaveBeenCalledWith('/venues', { params: { city: undefined } });
            expect(result).toEqual(mockVenues);
        });

        it('should get venues filtered by city', async () => {
            const mockVenues = [{ id: 1, name: 'Venue in HCM' }];
            mockGet.mockResolvedValueOnce({ data: mockVenues });

            const result = await api.getVenues('HCM');

            expect(mockGet).toHaveBeenCalledWith('/venues', { params: { city: 'HCM' } });
            expect(result).toEqual(mockVenues);
        });

        it('should get single venue by id', async () => {
            const mockVenue = { id: 1, name: 'Venue 1', fields: [] };
            mockGet.mockResolvedValueOnce({ data: mockVenue });

            const result = await api.getVenue(1);

            expect(mockGet).toHaveBeenCalledWith('/venues/1');
            expect(result).toEqual(mockVenue);
        });

        it('should get field type pricing', async () => {
            const mockPricing = [{ fieldType: 'FIELD_5VS5', minPrice: 100000 }];
            mockGet.mockResolvedValueOnce({ data: mockPricing });

            const result = await api.getFieldTypePricing(1, '2024-01-15');

            expect(mockGet).toHaveBeenCalledWith('/venues/1/field-types', { params: { date: '2024-01-15' } });
            expect(result).toEqual(mockPricing);
        });

        it('should get field type slots', async () => {
            const mockSlots = [{ fieldId: 1, slots: [] }];
            mockGet.mockResolvedValueOnce({ data: mockSlots });

            const fieldType: FieldType = 'FIELD_5VS5';
            const result = await api.getFieldTypeSlots(1, fieldType, '2024-01-15');

            expect(mockGet).toHaveBeenCalledWith('/venues/1/field-types/FIELD_5VS5/slots', { params: { date: '2024-01-15' } });
            expect(result).toEqual(mockSlots);
        });
    });

    describe('Field Endpoints', () => {
        it('should get all fields', async () => {
            const mockFields = [{ id: 1, name: 'Field 1' }];
            mockGet.mockResolvedValueOnce({ data: mockFields });

            const result = await api.getFields();

            expect(mockGet).toHaveBeenCalledWith('/fields', { params: undefined });
            expect(result).toEqual(mockFields);
        });

        it('should get fields with filter', async () => {
            const mockFields = [{ id: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockFields });

            const filter: FieldFilter = { city: 'HCM', fieldType: 'FIELD_5VS5' };
            const result = await api.getFields(filter);

            expect(mockGet).toHaveBeenCalledWith('/fields', { params: filter });
            expect(result).toEqual(mockFields);
        });

        it('should get single field by id', async () => {
            const mockField = { id: 1, name: 'Field 1' };
            mockGet.mockResolvedValueOnce({ data: mockField });

            const result = await api.getField(1);

            expect(mockGet).toHaveBeenCalledWith('/fields/1');
            expect(result).toEqual(mockField);
        });

        it('should get field stats', async () => {
            const mockStats = { total: 10, byType: { 'FIELD_5VS5': 5, 'FIELD_7VS7': 5 }, minPrice: 50000 };
            mockGet.mockResolvedValueOnce({ data: mockStats });

            const result = await api.getFieldStats();

            expect(mockGet).toHaveBeenCalledWith('/fields/stats');
            expect(result).toEqual(mockStats);
        });

        it('should get field pricing', async () => {
            const mockPricing = {
                fieldId: 1,
                dayType: 'WEEKDAY',
                date: '2024-01-15',
                slots: [{ startTime: '08:00', endTime: '09:00', price: 100000, isPeakHour: false }],
            };
            mockGet.mockResolvedValueOnce({ data: mockPricing });

            const result = await api.getFieldPricing(1, '2024-01-15');

            expect(mockGet).toHaveBeenCalledWith('/fields/1/pricing', { params: { date: '2024-01-15' } });
            expect(result).toEqual(mockPricing);
        });
    });

    describe('Booking Endpoints', () => {
        it('should get all bookings', async () => {
            const mockBookings = [{ id: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockBookings });

            const result = await api.getBookings();

            expect(mockGet).toHaveBeenCalledWith('/bookings', { params: undefined });
            expect(result).toEqual(mockBookings);
        });

        it('should get bookings with filter', async () => {
            const mockBookings = [{ id: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockBookings });

            const result = await api.getBookings({ playerId: 1, status: 'CONFIRMED' });

            expect(mockGet).toHaveBeenCalledWith('/bookings', { params: { playerId: 1, status: 'CONFIRMED' } });
            expect(result).toEqual(mockBookings);
        });

        it('should create booking', async () => {
            const bookingData = {
                fieldId: 1,
                playerId: 1,
                customerName: 'Test User',
                customerPhone: '0123456789',
                startTime: '2024-01-15T08:00:00',
                endTime: '2024-01-15T09:00:00',
                totalPrice: 200000,
            };
            const mockBooking = { id: 1, ...bookingData };
            mockPost.mockResolvedValueOnce({ data: mockBooking });

            const result = await api.createBooking(bookingData);

            expect(mockPost).toHaveBeenCalledWith('/bookings', bookingData);
            expect(result).toEqual(mockBooking);
        });

        it('should get field availability', async () => {
            const mockAvailability = { date: '2024-01-15', slots: [] };
            mockGet.mockResolvedValueOnce({ data: mockAvailability });

            const result = await api.getFieldAvailability(1, '2024-01-15');

            expect(mockGet).toHaveBeenCalledWith('/bookings/field/1/availability', { params: { date: '2024-01-15' } });
            expect(result).toEqual(mockAvailability);
        });

        it('should get single booking', async () => {
            const mockBooking = { id: 1 };
            mockGet.mockResolvedValueOnce({ data: mockBooking });

            const result = await api.getBooking(1);

            expect(mockGet).toHaveBeenCalledWith('/bookings/1');
            expect(result).toEqual(mockBooking);
        });

        it('should update booking', async () => {
            const mockBooking = { id: 1, status: 'UPDATED' };
            mockPatch.mockResolvedValueOnce({ data: mockBooking });

            const result = await api.updateBooking(1, { note: 'Updated note' } as any);

            expect(mockPatch).toHaveBeenCalledWith('/bookings/1', { note: 'Updated note' });
            expect(result).toEqual(mockBooking);
        });

        it('should confirm booking', async () => {
            const mockBooking = { id: 1, status: 'CONFIRMED' };
            mockPatch.mockResolvedValueOnce({ data: mockBooking });

            const result = await api.confirmBooking(1);

            expect(mockPatch).toHaveBeenCalledWith('/bookings/1/confirm');
            expect(result).toEqual(mockBooking);
        });

        it('should cancel booking', async () => {
            const mockBooking = { id: 1, status: 'CANCELED' };
            mockPatch.mockResolvedValueOnce({ data: mockBooking });

            const result = await api.cancelBooking(1);

            expect(mockPatch).toHaveBeenCalledWith('/bookings/1/cancel');
            expect(result).toEqual(mockBooking);
        });

        it('should delete booking', async () => {
            mockDelete.mockResolvedValueOnce({});

            await api.deleteBooking(1);

            expect(mockDelete).toHaveBeenCalledWith('/bookings/1');
        });
    });

    describe('Payment Endpoints', () => {
        it('should create payment', async () => {
            const paymentData = { bookingId: 1, amount: 200000, method: 'CASH' };
            const mockPayment = { id: 1, ...paymentData };
            mockPost.mockResolvedValueOnce({ data: mockPayment });

            const result = await api.createPayment(paymentData);

            expect(mockPost).toHaveBeenCalledWith('/payments', paymentData);
            expect(result).toEqual(mockPayment);
        });

        it('should get all payments', async () => {
            const mockPayments = [{ id: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockPayments });

            const result = await api.getPayments();

            expect(mockGet).toHaveBeenCalledWith('/payments', { params: { status: undefined } });
            expect(result).toEqual(mockPayments);
        });

        it('should get payments by status', async () => {
            const mockPayments = [{ id: 1, status: 'COMPLETED' }];
            mockGet.mockResolvedValueOnce({ data: mockPayments });

            const result = await api.getPayments('COMPLETED');

            expect(mockGet).toHaveBeenCalledWith('/payments', { params: { status: 'COMPLETED' } });
            expect(result).toEqual(mockPayments);
        });

        it('should get single payment', async () => {
            const mockPayment = { id: 1 };
            mockGet.mockResolvedValueOnce({ data: mockPayment });

            const result = await api.getPayment(1);

            expect(mockGet).toHaveBeenCalledWith('/payments/1');
            expect(result).toEqual(mockPayment);
        });

        it('should confirm payment', async () => {
            const mockPayment = { id: 1, status: 'CONFIRMED' };
            mockPatch.mockResolvedValueOnce({ data: mockPayment });

            const result = await api.confirmPayment(1);

            expect(mockPatch).toHaveBeenCalledWith('/payments/1/confirm');
            expect(result).toEqual(mockPayment);
        });

        it('should get payment by booking id', async () => {
            const mockPayment = { id: 1, bookingId: 5 };
            mockGet.mockResolvedValueOnce({ data: mockPayment });

            const result = await api.getPaymentByBookingId(5);

            expect(mockGet).toHaveBeenCalledWith('/payments/booking/5');
            expect(result).toEqual(mockPayment);
        });
    });

    describe('Review Endpoints', () => {
        it('should get all reviews', async () => {
            const mockReviews = [{ id: 1, rating: 5 }];
            mockGet.mockResolvedValueOnce({ data: mockReviews });

            const result = await api.getReviews();

            expect(mockGet).toHaveBeenCalledWith('/reviews', { params: { fieldId: undefined } });
            expect(result).toEqual(mockReviews);
        });

        it('should get reviews by field id', async () => {
            const mockReviews = [{ id: 1, fieldId: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockReviews });

            const result = await api.getReviews(1);

            expect(mockGet).toHaveBeenCalledWith('/reviews', { params: { fieldId: 1 } });
            expect(result).toEqual(mockReviews);
        });

        it('should get single review', async () => {
            const mockReview = { id: 1, rating: 5 };
            mockGet.mockResolvedValueOnce({ data: mockReview });

            const result = await api.getReview(1);

            expect(mockGet).toHaveBeenCalledWith('/reviews/1');
            expect(result).toEqual(mockReview);
        });

        it('should create review', async () => {
            const reviewData = { fieldId: 1, playerId: 1, rating: 5, comment: 'Great!' };
            const mockReview = { id: 1, ...reviewData };
            mockPost.mockResolvedValueOnce({ data: mockReview });

            const result = await api.createReview(reviewData);

            expect(mockPost).toHaveBeenCalledWith('/reviews', reviewData);
            expect(result).toEqual(mockReview);
        });

        it('should update review', async () => {
            const mockReview = { id: 1, rating: 4, comment: 'Updated' };
            mockPatch.mockResolvedValueOnce({ data: mockReview });

            const result = await api.updateReview(1, { rating: 4, comment: 'Updated' } as any);

            expect(mockPatch).toHaveBeenCalledWith('/reviews/1', { rating: 4, comment: 'Updated' });
            expect(result).toEqual(mockReview);
        });

        it('should delete review', async () => {
            mockDelete.mockResolvedValueOnce({});

            await api.deleteReview(1);

            expect(mockDelete).toHaveBeenCalledWith('/reviews/1');
        });
    });

    describe('Favorites Endpoints', () => {
        it('should get favorites', async () => {
            const mockFavorites = [{ id: 1, fieldId: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockFavorites });

            const result = await api.getFavorites();

            expect(mockGet).toHaveBeenCalledWith('/favorites');
            expect(result).toEqual(mockFavorites);
        });

        it('should add favorite', async () => {
            const mockResult = { id: 1, fieldId: 1 };
            mockPost.mockResolvedValueOnce({ data: mockResult });

            const result = await api.addFavorite(1);

            expect(mockPost).toHaveBeenCalledWith('/favorites/1');
            expect(result).toEqual(mockResult);
        });

        it('should remove favorite', async () => {
            mockDelete.mockResolvedValueOnce({});

            await api.removeFavorite(1);

            expect(mockDelete).toHaveBeenCalledWith('/favorites/1');
        });

        it('should check favorite status', async () => {
            const mockResult = { isFavorite: true };
            mockGet.mockResolvedValueOnce({ data: mockResult });

            const result = await api.checkFavorite(1);

            expect(mockGet).toHaveBeenCalledWith('/favorites/1/check');
            expect(result).toEqual(mockResult);
        });

        it('should toggle favorite', async () => {
            const mockResult = { isFavorite: true, message: 'Added to favorites' };
            mockPost.mockResolvedValueOnce({ data: mockResult });

            const result = await api.toggleFavorite(1);

            expect(mockPost).toHaveBeenCalledWith('/favorites/1/toggle');
            expect(result).toEqual(mockResult);
        });
    });

    describe('Notification Endpoints', () => {
        it('should get notifications', async () => {
            const mockNotifications = [{ id: 1, message: 'Test' }];
            mockGet.mockResolvedValueOnce({ data: mockNotifications });

            const result = await api.getNotifications();

            expect(mockGet).toHaveBeenCalledWith('/notifications', { params: { unreadOnly: undefined } });
            expect(result).toEqual(mockNotifications);
        });

        it('should get unread notifications only', async () => {
            const mockNotifications = [{ id: 1, isRead: false }];
            mockGet.mockResolvedValueOnce({ data: mockNotifications });

            const result = await api.getNotifications(true);

            expect(mockGet).toHaveBeenCalledWith('/notifications', { params: { unreadOnly: 'true' } });
            expect(result).toEqual(mockNotifications);
        });

        it('should get unread notification count', async () => {
            const mockResult = { unreadCount: 5 };
            mockGet.mockResolvedValueOnce({ data: mockResult });

            const result = await api.getUnreadNotificationCount();

            expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count');
            expect(result).toEqual(mockResult);
        });

        it('should mark notification as read', async () => {
            const mockResult = { id: 1, isRead: true };
            mockPatch.mockResolvedValueOnce({ data: mockResult });

            const result = await api.markNotificationAsRead(1);

            expect(mockPatch).toHaveBeenCalledWith('/notifications/1/read');
            expect(result).toEqual(mockResult);
        });

        it('should mark all notifications as read', async () => {
            const mockResult = { message: 'All notifications marked as read' };
            mockPatch.mockResolvedValueOnce({ data: mockResult });

            const result = await api.markAllNotificationsAsRead();

            expect(mockPatch).toHaveBeenCalledWith('/notifications/read-all');
            expect(result).toEqual(mockResult);
        });

        it('should delete notification', async () => {
            mockDelete.mockResolvedValueOnce({});

            await api.deleteNotification(1);

            expect(mockDelete).toHaveBeenCalledWith('/notifications/1');
        });
    });

    describe('Messaging Endpoints', () => {
        it('should get conversations', async () => {
            const mockConversations = [{ id: 1 }];
            mockGet.mockResolvedValueOnce({ data: mockConversations });

            const result = await api.getConversations();

            expect(mockGet).toHaveBeenCalledWith('/conversations');
            expect(result).toEqual(mockConversations);
        });

        it('should get messages', async () => {
            const mockMessages = [{ id: 1, content: 'Hello' }];
            mockGet.mockResolvedValueOnce({ data: mockMessages });

            const result = await api.getMessages(1);

            expect(mockGet).toHaveBeenCalledWith('/conversations/1/messages');
            expect(result).toEqual(mockMessages);
        });

        it('should send message', async () => {
            const mockMessage = { id: 1, content: 'Hi there', conversationId: 1 };
            mockPost.mockResolvedValueOnce({ data: mockMessage });

            const result = await api.sendMessage(1, 'Hi there');

            expect(mockPost).toHaveBeenCalledWith('/conversations/1/messages', { content: 'Hi there' });
            expect(result).toEqual(mockMessage);
        });

        it('should start conversation', async () => {
            const mockConversation = { id: 1, fieldId: 1 };
            mockPost.mockResolvedValueOnce({ data: mockConversation });

            const result = await api.startConversation(1, 'Initial message');

            expect(mockPost).toHaveBeenCalledWith('/conversations/start', { fieldId: 1, message: 'Initial message' });
            expect(result).toEqual(mockConversation);
        });
    });
});

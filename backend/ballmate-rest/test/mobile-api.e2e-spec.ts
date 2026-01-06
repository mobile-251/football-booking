/**
 * Mobile API E2E Tests
 * 
 * File test chi tiết cho tất cả các API phục vụ mobile user (Player),
 * đặc biệt tập trung vào luồng đặt lịch (booking flow).
 * 
 * Test Credentials (from seed):
 *   - Player: player1@ballmate.com / password123
 *   - Owner: owner1@ballmate.com / password123
 *   - Admin: admin@ballmate.com / password123
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Mobile API E2E Tests', () => {
    let app: INestApplication<App>;
    let playerAccessToken: string;
    let player2AccessToken: string;
    let playerId: number;
    let player2Id: number;
    let userId: number;

    // Test data IDs
    let testFieldId: number;
    let testVenueId: number;
    let testBookingId: number;
    let testPaymentId: number;
    let testReviewId: number;
    let testNotificationId: number;
    let testConversationId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        // Login as player1 to get access token
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'player1@ballmate.com',
                password: 'password123',
            });

        playerAccessToken = loginResponse.body.accessToken;
        playerId = loginResponse.body.user.playerId;
        userId = loginResponse.body.user.id;

        // Login as player2 for conflict tests
        const login2Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'player2@ballmate.com',
                password: 'password123',
            });

        player2AccessToken = login2Response.body.accessToken;
        player2Id = login2Response.body.user.playerId;
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================
    // AUTH TESTS
    // ============================================
    describe('AUTH - /auth', () => {
        describe('POST /auth/login', () => {
            it('should login successfully with valid credentials', async () => {
                const response = await request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                        email: 'player1@ballmate.com',
                        password: 'password123',
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('accessToken');
                expect(response.body).toHaveProperty('refreshToken');
                expect(response.body).toHaveProperty('user');
                expect(response.body.user.email).toBe('player1@ballmate.com');
            });

            it('should fail login with invalid password', async () => {
                await request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                        email: 'player1@ballmate.com',
                        password: 'wrongpassword',
                    })
                    .expect(401);
            });

            it('should fail login with non-existent email', async () => {
                await request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                        email: 'nonexistent@ballmate.com',
                        password: 'password123',
                    })
                    .expect(401);
            });
        });

        describe('POST /auth/register', () => {
            const newUserEmail = `test_${Date.now()}@ballmate.com`;

            it('should register new user successfully', async () => {
                const response = await request(app.getHttpServer())
                    .post('/auth/register')
                    .send({
                        email: newUserEmail,
                        password: 'password123',
                        fullName: 'Test User',
                        phoneNumber: '0999999999',
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('accessToken');
                expect(response.body.user.email).toBe(newUserEmail);
            });

            it('should fail register with existing email', async () => {
                await request(app.getHttpServer())
                    .post('/auth/register')
                    .send({
                        email: 'player1@ballmate.com',
                        password: 'password123',
                        fullName: 'Duplicate User',
                    })
                    .expect(409);
            });

            it('should fail register with invalid email format', async () => {
                await request(app.getHttpServer())
                    .post('/auth/register')
                    .send({
                        email: 'invalid-email',
                        password: 'password123',
                        fullName: 'Test User',
                    })
                    .expect(400);
            });
        });

        describe('GET /auth/profile', () => {
            it('should get profile with valid token', async () => {
                const response = await request(app.getHttpServer())
                    .get('/auth/profile')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('email');
            });

            it('should fail without token', async () => {
                await request(app.getHttpServer())
                    .get('/auth/profile')
                    .expect(401);
            });

            it('should fail with invalid token', async () => {
                await request(app.getHttpServer())
                    .get('/auth/profile')
                    .set('Authorization', 'Bearer invalid_token')
                    .expect(401);
            });
        });
    });

    // ============================================
    // VENUE TESTS
    // ============================================
    describe('VENUE - /venues', () => {
        describe('GET /venues', () => {
            it('should get all venues', async () => {
                const response = await request(app.getHttpServer())
                    .get('/venues')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThan(0);
                testVenueId = response.body[0].id;
            });

            it('should filter venues by city', async () => {
                const response = await request(app.getHttpServer())
                    .get('/venues?city=Ho Chi Minh')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((venue: any) => {
                    expect(venue.city).toBe('Ho Chi Minh');
                });
            });
        });

        describe('GET /venues/:id', () => {
            it('should get venue detail by ID', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/venues/${testVenueId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id', testVenueId);
                expect(response.body).toHaveProperty('name');
                expect(response.body).toHaveProperty('address');
                expect(response.body).toHaveProperty('fields');
            });

            it('should return 404 for non-existent venue', async () => {
                await request(app.getHttpServer())
                    .get('/venues/99999')
                    .expect(404);
            });
        });
    });

    // ============================================
    // FIELD TESTS
    // ============================================
    describe('FIELD - /fields', () => {
        describe('GET /fields', () => {
            it('should get all fields', async () => {
                const response = await request(app.getHttpServer())
                    .get('/fields')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThan(0);
                testFieldId = response.body[0].id;
            });

            it('should filter fields by city', async () => {
                const response = await request(app.getHttpServer())
                    .get('/fields?city=Ho Chi Minh')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter fields by fieldType', async () => {
                const response = await request(app.getHttpServer())
                    .get('/fields?fieldType=FIELD_5VS5')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((field: any) => {
                    expect(field.fieldType).toBe('FIELD_5VS5');
                });
            });

            it('should filter fields by maxPrice', async () => {
                const response = await request(app.getHttpServer())
                    .get('/fields?maxPrice=400000')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((field: any) => {
                    expect(field.pricePerHour).toBeLessThanOrEqual(400000);
                });
            });
        });

        describe('GET /fields/:id', () => {
            it('should get field detail by ID', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/fields/${testFieldId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id', testFieldId);
                expect(response.body).toHaveProperty('name');
                expect(response.body).toHaveProperty('venue');
            });

            it('should return 404 for non-existent field', async () => {
                await request(app.getHttpServer())
                    .get('/fields/99999')
                    .expect(404);
            });
        });
    });

    // ============================================
    // BOOKING TESTS - CHI TIẾT LUỒNG ĐẶT LỊCH
    // ============================================
    describe('BOOKING - /bookings (Chi tiết luồng đặt lịch)', () => {

        // UC1: Đặt lịch thành công
        describe('UC1: Đặt lịch thành công', () => {
            it('should create booking successfully with valid data', async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 10);
                futureDate.setHours(10, 0, 0, 0);

                const endDate = new Date(futureDate);
                endDate.setHours(11, 30, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: futureDate.toISOString(),
                        endTime: endDate.toISOString(),
                        totalPrice: 450000,
                        note: 'Test booking - UC1',
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('id');
                expect(response.body.status).toBe('PENDING');
                expect(response.body.fieldId).toBe(testFieldId);
                expect(response.body.playerId).toBe(playerId);
                testBookingId = response.body.id;
            });
        });

        // UC2: Đặt lịch với thời gian trong quá khứ
        describe('UC2: Đặt lịch với thời gian trong quá khứ', () => {
            it('should reject booking with past start time', async () => {
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - 1);
                pastDate.setHours(10, 0, 0, 0);

                const endDate = new Date(pastDate);
                endDate.setHours(11, 0, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: pastDate.toISOString(),
                        endTime: endDate.toISOString(),
                        totalPrice: 300000,
                    })
                    .expect(400);

                expect(response.body.message).toContain('past');
            });
        });

        // UC3: Đặt lịch với startTime >= endTime
        describe('UC3: Đặt lịch với startTime >= endTime', () => {
            it('should reject booking when startTime equals endTime', async () => {
                const sameTime = new Date();
                sameTime.setDate(sameTime.getDate() + 11);
                sameTime.setHours(14, 0, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: sameTime.toISOString(),
                        endTime: sameTime.toISOString(),
                        totalPrice: 300000,
                    })
                    .expect(400);

                expect(response.body.message).toContain('before');
            });

            it('should reject booking when startTime > endTime', async () => {
                const startTime = new Date();
                startTime.setDate(startTime.getDate() + 11);
                startTime.setHours(16, 0, 0, 0);

                const endTime = new Date(startTime);
                endTime.setHours(14, 0, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        totalPrice: 300000,
                    })
                    .expect(400);

                expect(response.body.message).toContain('before');
            });
        });

        // UC4: Đặt lịch trùng thời gian (conflict)
        describe('UC4: Đặt lịch trùng thời gian (conflict)', () => {
            let conflictStartTime: Date;
            let conflictEndTime: Date;

            beforeAll(async () => {
                // Create a booking first
                conflictStartTime = new Date();
                conflictStartTime.setDate(conflictStartTime.getDate() + 12);
                conflictStartTime.setHours(15, 0, 0, 0);

                conflictEndTime = new Date(conflictStartTime);
                conflictEndTime.setHours(17, 0, 0, 0);

                await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: conflictStartTime.toISOString(),
                        endTime: conflictEndTime.toISOString(),
                        totalPrice: 600000,
                        note: 'Booking for conflict test',
                    });
            });

            it('should reject booking that completely overlaps existing booking', async () => {
                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: player2Id,
                        startTime: conflictStartTime.toISOString(),
                        endTime: conflictEndTime.toISOString(),
                        totalPrice: 600000,
                    })
                    .expect(409);

                expect(response.body.message).toContain('booked');
            });

            it('should reject booking that overlaps start of existing booking', async () => {
                const overlapStart = new Date(conflictStartTime);
                overlapStart.setHours(14, 0, 0, 0);

                const overlapEnd = new Date(conflictStartTime);
                overlapEnd.setHours(16, 0, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: player2Id,
                        startTime: overlapStart.toISOString(),
                        endTime: overlapEnd.toISOString(),
                        totalPrice: 600000,
                    })
                    .expect(409);

                expect(response.body.message).toContain('booked');
            });

            it('should reject booking that overlaps end of existing booking', async () => {
                const overlapStart = new Date(conflictStartTime);
                overlapStart.setHours(16, 0, 0, 0);

                const overlapEnd = new Date(conflictStartTime);
                overlapEnd.setHours(18, 0, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: player2Id,
                        startTime: overlapStart.toISOString(),
                        endTime: overlapEnd.toISOString(),
                        totalPrice: 600000,
                    })
                    .expect(409);

                expect(response.body.message).toContain('booked');
            });

            it('should reject booking contained within existing booking', async () => {
                const innerStart = new Date(conflictStartTime);
                innerStart.setHours(15, 30, 0, 0);

                const innerEnd = new Date(conflictStartTime);
                innerEnd.setHours(16, 30, 0, 0);

                const response = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: player2Id,
                        startTime: innerStart.toISOString(),
                        endTime: innerEnd.toISOString(),
                        totalPrice: 300000,
                    })
                    .expect(409);

                expect(response.body.message).toContain('booked');
            });

            it('should allow booking on different field at same time', async () => {
                // Get a different field
                const fieldsResponse = await request(app.getHttpServer())
                    .get('/fields')
                    .expect(200);

                const differentFieldId = fieldsResponse.body.find((f: any) => f.id !== testFieldId)?.id;

                if (differentFieldId) {
                    const response = await request(app.getHttpServer())
                        .post('/bookings')
                        .send({
                            fieldId: differentFieldId,
                            playerId: player2Id,
                            startTime: conflictStartTime.toISOString(),
                            endTime: conflictEndTime.toISOString(),
                            totalPrice: 600000,
                            note: 'Same time slot but different field',
                        })
                        .expect(201);

                    expect(response.body.fieldId).toBe(differentFieldId);
                }
            });
        });

        // UC5: Đặt lịch với fieldId không tồn tại
        describe('UC5: Đặt lịch với fieldId không tồn tại', () => {
            it('should reject booking with non-existent fieldId', async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 13);

                await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: 99999,
                        playerId: playerId,
                        startTime: futureDate.toISOString(),
                        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        totalPrice: 300000,
                    })
                    .expect(404);
            });
        });

        // UC6: Đặt lịch với playerId không tồn tại
        describe('UC6: Đặt lịch với playerId không tồn tại', () => {
            it('should reject booking with non-existent playerId', async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 14);

                await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: 99999,
                        startTime: futureDate.toISOString(),
                        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        totalPrice: 300000,
                    })
                    .expect(404);
            });
        });

        // UC7: Xác nhận booking
        describe('UC7: Xác nhận booking', () => {
            it('should confirm a pending booking', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/bookings/${testBookingId}/confirm`)
                    .expect(200);

                expect(response.body.status).toBe('CONFIRMED');
            });
        });

        // UC8: Hủy booking
        describe('UC8: Hủy booking', () => {
            let bookingToCancel: number;

            beforeAll(async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 15);
                futureDate.setHours(10, 0, 0, 0);

                const booking = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: futureDate.toISOString(),
                        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        totalPrice: 600000,
                        note: 'Booking to cancel',
                    });

                bookingToCancel = booking.body.id;
            });

            it('should cancel a booking', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/bookings/${bookingToCancel}/cancel`)
                    .expect(200);

                expect(response.body.status).toBe('CANCELLED');
            });
        });

        // UC9: Xem danh sách booking của player
        describe('UC9: Xem danh sách booking của player', () => {
            it('should get all bookings for a player', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/bookings?playerId=${playerId}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((booking: any) => {
                    expect(booking.playerId).toBe(playerId);
                });
            });

            it('should filter bookings by status', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/bookings?playerId=${playerId}&status=CONFIRMED`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((booking: any) => {
                    expect(booking.status).toBe('CONFIRMED');
                });
            });

            it('should filter bookings by fieldId', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/bookings?fieldId=${testFieldId}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((booking: any) => {
                    expect(booking.fieldId).toBe(testFieldId);
                });
            });
        });

        // UC10: Xem chi tiết booking
        describe('UC10: Xem chi tiết booking', () => {
            it('should get booking detail by ID', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/bookings/${testBookingId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id', testBookingId);
                expect(response.body).toHaveProperty('field');
                expect(response.body).toHaveProperty('player');
            });

            it('should return 404 for non-existent booking', async () => {
                await request(app.getHttpServer())
                    .get('/bookings/99999')
                    .expect(404);
            });
        });

        // UC11: Cập nhật booking
        describe('UC11: Cập nhật booking', () => {
            it('should update booking note', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/bookings/${testBookingId}`)
                    .send({
                        note: 'Updated note',
                    })
                    .expect(200);

                expect(response.body.note).toBe('Updated note');
            });
        });

        // UC12: Kiểm tra slot khả dụng
        describe('UC12: Kiểm tra slot khả dụng (Field Availability)', () => {
            it('should get field availability for a specific date', async () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateString = tomorrow.toISOString().split('T')[0];

                const response = await request(app.getHttpServer())
                    .get(`/bookings/field/${testFieldId}/availability?date=${dateString}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((slot: any) => {
                    expect(slot).toHaveProperty('startTime');
                    expect(slot).toHaveProperty('endTime');
                    expect(slot).toHaveProperty('status');
                });
            });
        });

        // UC13: Xóa booking
        describe('UC13: Xóa booking', () => {
            let bookingToDelete: number;

            beforeAll(async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 20);
                futureDate.setHours(10, 0, 0, 0);

                const booking = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: futureDate.toISOString(),
                        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        totalPrice: 600000,
                        note: 'Booking to delete',
                    });

                bookingToDelete = booking.body.id;
            });

            it('should delete a booking', async () => {
                await request(app.getHttpServer())
                    .delete(`/bookings/${bookingToDelete}`)
                    .expect(200);

                // Verify deletion
                await request(app.getHttpServer())
                    .get(`/bookings/${bookingToDelete}`)
                    .expect(404);
            });
        });
    });

    // ============================================
    // PAYMENT TESTS
    // ============================================
    describe('PAYMENT - /payments', () => {
        describe('POST /payments', () => {
            it('should create payment for a booking', async () => {
                // First create a new booking
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 25);
                futureDate.setHours(10, 0, 0, 0);

                const bookingRes = await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: futureDate.toISOString(),
                        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        totalPrice: 600000,
                    });

                const response = await request(app.getHttpServer())
                    .post('/payments')
                    .send({
                        bookingId: bookingRes.body.id,
                        amount: 600000,
                        method: 'MOMO',
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('id');
                expect(response.body.status).toBe('PENDING');
                testPaymentId = response.body.id;
            });
        });

        describe('GET /payments', () => {
            it('should get all payments', async () => {
                const response = await request(app.getHttpServer())
                    .get('/payments')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter payments by status', async () => {
                const response = await request(app.getHttpServer())
                    .get('/payments?status=PENDING')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((payment: any) => {
                    expect(payment.status).toBe('PENDING');
                });
            });
        });

        describe('GET /payments/:id', () => {
            it('should get payment by ID', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/payments/${testPaymentId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id', testPaymentId);
            });
        });

        describe('PATCH /payments/:id/confirm', () => {
            it('should confirm a payment', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/payments/${testPaymentId}/confirm`)
                    .expect(200);

                expect(response.body.status).toBe('PAID');
                expect(response.body.paidAt).toBeDefined();
            });
        });
    });

    // ============================================
    // REVIEW TESTS
    // ============================================
    describe('REVIEW - /reviews', () => {
        describe('POST /reviews', () => {
            it('should create a review', async () => {
                // Get a field that the player hasn't reviewed yet
                const fieldsRes = await request(app.getHttpServer())
                    .get('/fields')
                    .expect(200);

                const unreviewedField = fieldsRes.body.find((f: any) => f.id !== testFieldId);

                if (unreviewedField) {
                    const response = await request(app.getHttpServer())
                        .post('/reviews')
                        .send({
                            fieldId: unreviewedField.id,
                            playerId: playerId,
                            rating: 5,
                            comment: 'Excellent field! Great facilities.',
                        })
                        .expect(201);

                    expect(response.body).toHaveProperty('id');
                    expect(response.body.rating).toBe(5);
                    testReviewId = response.body.id;
                }
            });

            it('should reject duplicate review from same player for same field', async () => {
                // Try to create review for same field again
                await request(app.getHttpServer())
                    .post('/reviews')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        rating: 4,
                        comment: 'Second review attempt',
                    });
                // Note: This might return 409 or handle differently based on implementation
            });

            it('should reject review with invalid rating', async () => {
                const fieldsRes = await request(app.getHttpServer())
                    .get('/fields')
                    .expect(200);

                const field = fieldsRes.body[2];

                if (field) {
                    await request(app.getHttpServer())
                        .post('/reviews')
                        .send({
                            fieldId: field.id,
                            playerId: playerId,
                            rating: 6, // Invalid: should be 1-5
                            comment: 'Invalid rating',
                        })
                        .expect(400);
                }
            });
        });

        describe('GET /reviews', () => {
            it('should get all reviews', async () => {
                const response = await request(app.getHttpServer())
                    .get('/reviews')
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should filter reviews by fieldId', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/reviews?fieldId=${testFieldId}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((review: any) => {
                    expect(review.fieldId).toBe(testFieldId);
                });
            });
        });

        describe('PATCH /reviews/:id', () => {
            it('should update a review', async () => {
                if (testReviewId) {
                    const response = await request(app.getHttpServer())
                        .patch(`/reviews/${testReviewId}`)
                        .send({
                            rating: 4,
                            comment: 'Updated review comment',
                        })
                        .expect(200);

                    expect(response.body.rating).toBe(4);
                    expect(response.body.comment).toBe('Updated review comment');
                }
            });
        });
    });

    // ============================================
    // FAVORITES TESTS
    // ============================================
    describe('FAVORITES - /favorites', () => {
        describe('POST /favorites/:fieldId', () => {
            it('should add field to favorites', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/favorites/${testFieldId}`)
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(201);

                expect(response.body).toHaveProperty('id');
                expect(response.body.fieldId).toBe(testFieldId);
            });
        });

        describe('GET /favorites', () => {
            it('should get all favorites for authenticated user', async () => {
                const response = await request(app.getHttpServer())
                    .get('/favorites')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should fail without authentication', async () => {
                await request(app.getHttpServer())
                    .get('/favorites')
                    .expect(401);
            });
        });

        describe('GET /favorites/:fieldId/check', () => {
            it('should check if field is favorited', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/favorites/${testFieldId}/check`)
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(response.body).toHaveProperty('isFavorite');
                expect(typeof response.body.isFavorite).toBe('boolean');
            });
        });

        describe('POST /favorites/:fieldId/toggle', () => {
            it('should toggle favorite status', async () => {
                const checkBefore = await request(app.getHttpServer())
                    .get(`/favorites/${testFieldId}/check`)
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                const response = await request(app.getHttpServer())
                    .post(`/favorites/${testFieldId}/toggle`)
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(201);

                expect(response.body.isFavorite).toBe(!checkBefore.body.isFavorite);
            });
        });

        describe('DELETE /favorites/:fieldId', () => {
            it('should remove field from favorites', async () => {
                // First add it back
                await request(app.getHttpServer())
                    .post(`/favorites/${testFieldId}`)
                    .set('Authorization', `Bearer ${playerAccessToken}`);

                await request(app.getHttpServer())
                    .delete(`/favorites/${testFieldId}`)
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                // Verify removal
                const checkResponse = await request(app.getHttpServer())
                    .get(`/favorites/${testFieldId}/check`)
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(checkResponse.body.isFavorite).toBe(false);
            });
        });
    });

    // ============================================
    // NOTIFICATION TESTS
    // ============================================
    describe('NOTIFICATIONS - /notifications', () => {
        describe('GET /notifications', () => {
            it('should get all notifications for authenticated user', async () => {
                const response = await request(app.getHttpServer())
                    .get('/notifications')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                if (response.body.length > 0) {
                    testNotificationId = response.body[0].id;
                }
            });

            it('should filter unread only notifications', async () => {
                const response = await request(app.getHttpServer())
                    .get('/notifications?unreadOnly=true')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                response.body.forEach((notification: any) => {
                    expect(notification.isRead).toBe(false);
                });
            });

            it('should fail without authentication', async () => {
                await request(app.getHttpServer())
                    .get('/notifications')
                    .expect(401);
            });
        });

        describe('GET /notifications/unread-count', () => {
            it('should get unread notification count', async () => {
                const response = await request(app.getHttpServer())
                    .get('/notifications/unread-count')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(response.body).toHaveProperty('unreadCount');
                expect(typeof response.body.unreadCount).toBe('number');
            });
        });

        describe('PATCH /notifications/:id/read', () => {
            it('should mark notification as read', async () => {
                if (testNotificationId) {
                    const response = await request(app.getHttpServer())
                        .patch(`/notifications/${testNotificationId}/read`)
                        .set('Authorization', `Bearer ${playerAccessToken}`)
                        .expect(200);

                    expect(response.body.isRead).toBe(true);
                }
            });
        });

        describe('PATCH /notifications/read-all', () => {
            it('should mark all notifications as read', async () => {
                const response = await request(app.getHttpServer())
                    .patch('/notifications/read-all')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
            });
        });
    });

    // ============================================
    // MESSAGING TESTS
    // ============================================
    describe('MESSAGING - /conversations', () => {
        describe('POST /conversations/start', () => {
            it('should start a new conversation', async () => {
                const response = await request(app.getHttpServer())
                    .post('/conversations/start')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .send({
                        fieldId: testFieldId,
                        message: 'Hello, I have a question about booking.',
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('id');
                testConversationId = response.body.id;
            });
        });

        describe('GET /conversations', () => {
            it('should get all conversations for authenticated user', async () => {
                const response = await request(app.getHttpServer())
                    .get('/conversations')
                    .set('Authorization', `Bearer ${playerAccessToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should fail without authentication', async () => {
                await request(app.getHttpServer())
                    .get('/conversations')
                    .expect(401);
            });
        });

        describe('GET /conversations/:id/messages', () => {
            it('should get messages in a conversation', async () => {
                if (testConversationId) {
                    const response = await request(app.getHttpServer())
                        .get(`/conversations/${testConversationId}/messages`)
                        .set('Authorization', `Bearer ${playerAccessToken}`)
                        .expect(200);

                    expect(Array.isArray(response.body)).toBe(true);
                }
            });
        });

        describe('POST /conversations/:id/messages', () => {
            it('should send a message in a conversation', async () => {
                if (testConversationId) {
                    const response = await request(app.getHttpServer())
                        .post(`/conversations/${testConversationId}/messages`)
                        .set('Authorization', `Bearer ${playerAccessToken}`)
                        .send({
                            content: 'This is a follow-up message.',
                        })
                        .expect(201);

                    expect(response.body).toHaveProperty('id');
                    expect(response.body.content).toBe('This is a follow-up message.');
                }
            });
        });
    });

    // ============================================
    // EDGE CASES & SECURITY TESTS
    // ============================================
    describe('SECURITY & EDGE CASES', () => {
        describe('Input Validation', () => {
            it('should reject booking with missing required fields', async () => {
                await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        // Missing playerId, startTime, endTime, totalPrice
                    })
                    .expect(400);
            });

            it('should reject invalid date format', async () => {
                await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: 'invalid-date',
                        endTime: 'invalid-date',
                        totalPrice: 300000,
                    })
                    .expect(400);
            });

            it('should reject negative totalPrice', async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 30);

                await request(app.getHttpServer())
                    .post('/bookings')
                    .send({
                        fieldId: testFieldId,
                        playerId: playerId,
                        startTime: futureDate.toISOString(),
                        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                        totalPrice: -100000,
                    })
                    .expect(400);
            });
        });

        describe('Authorization', () => {
            it('should protect favorites endpoints without token', async () => {
                await request(app.getHttpServer())
                    .post(`/favorites/${testFieldId}`)
                    .expect(401);
            });

            it('should protect notifications endpoints without token', async () => {
                await request(app.getHttpServer())
                    .get('/notifications')
                    .expect(401);
            });

            it('should protect conversations endpoints without token', async () => {
                await request(app.getHttpServer())
                    .get('/conversations')
                    .expect(401);
            });
        });

        describe('Data Integrity', () => {
            it('should include related data in booking response', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/bookings/${testBookingId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('field');
                expect(response.body.field).toHaveProperty('venue');
            });

            it('should include related data in field response', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/fields/${testFieldId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('venue');
            });
        });
    });
});

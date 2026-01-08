import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '@prisma/client';

describe('PaymentController', () => {
    let controller: PaymentController;
    let paymentService: jest.Mocked<PaymentService>;

    const mockPayment = {
        id: 1,
        bookingId: 1,
        amount: 300000,
        method: 'MOMO',
        status: PaymentStatus.PENDING,
        transactionId: null,
        paidAt: null,
    };

    const mockPaymentService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByBookingId: jest.fn(),
        update: jest.fn(),
        confirmPayment: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentController],
            providers: [{ provide: PaymentService, useValue: mockPaymentService }],
        }).compile();

        controller = module.get<PaymentController>(PaymentController);
        paymentService = module.get(PaymentService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a payment', async () => {
            const createDto = { bookingId: 1, amount: 300000, method: 'MOMO' };
            mockPaymentService.create.mockResolvedValue(mockPayment);

            const result = await controller.create(createDto as any);

            expect(result).toEqual(mockPayment);
            expect(paymentService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return all payments without filter', async () => {
            mockPaymentService.findAll.mockResolvedValue([mockPayment]);

            const result = await controller.findAll();

            expect(result).toEqual([mockPayment]);
            expect(paymentService.findAll).toHaveBeenCalledWith(undefined);
        });

        it('should filter by status', async () => {
            mockPaymentService.findAll.mockResolvedValue([mockPayment]);

            await controller.findAll(PaymentStatus.PENDING);

            expect(paymentService.findAll).toHaveBeenCalledWith(PaymentStatus.PENDING);
        });
    });

    describe('findOne', () => {
        it('should return payment by id', async () => {
            mockPaymentService.findOne.mockResolvedValue(mockPayment);

            const result = await controller.findOne(1);

            expect(result).toEqual(mockPayment);
            expect(paymentService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('findByBookingId', () => {
        it('should return payment by booking id', async () => {
            mockPaymentService.findByBookingId.mockResolvedValue(mockPayment);

            const result = await controller.findByBookingId(1);

            expect(result).toEqual(mockPayment);
            expect(paymentService.findByBookingId).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update payment', async () => {
            const updateDto = { status: PaymentStatus.PAID };
            mockPaymentService.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.PAID });

            const result = await controller.update(1, updateDto as any);

            expect(result.status).toBe(PaymentStatus.PAID);
            expect(paymentService.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('confirmPayment', () => {
        it('should confirm payment', async () => {
            mockPaymentService.confirmPayment.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID,
                paidAt: new Date(),
            });

            const result = await controller.confirmPayment(1);

            expect(result.status).toBe(PaymentStatus.PAID);
            expect(paymentService.confirmPayment).toHaveBeenCalledWith(1);
        });
    });

    describe('remove', () => {
        it('should remove payment', async () => {
            mockPaymentService.remove.mockResolvedValue(mockPayment);

            const result = await controller.remove(1);

            expect(result).toEqual(mockPayment);
            expect(paymentService.remove).toHaveBeenCalledWith(1);
        });
    });
});

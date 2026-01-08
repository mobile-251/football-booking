/**
 * @file formatters.test.ts
 * @description Unit tests for src/utils/formatters.ts
 * Coverage target: 100% for this utility module
 */

import { formatPrice, formatCurrency } from './formatters';

describe('formatters', () => {
    describe('formatPrice', () => {
        it('should format zero correctly', () => {
            expect(formatPrice(0)).toBe('0');
        });

        it('should format small numbers without separators', () => {
            expect(formatPrice(100)).toBe('100');
            expect(formatPrice(999)).toBe('999');
        });

        it('should format thousands with dot separators', () => {
            expect(formatPrice(1000)).toBe('1.000');
            expect(formatPrice(10000)).toBe('10.000');
            expect(formatPrice(100000)).toBe('100.000');
        });

        it('should format millions with correct separators', () => {
            expect(formatPrice(1000000)).toBe('1.000.000');
            expect(formatPrice(5000000)).toBe('5.000.000');
        });

        it('should handle typical booking prices', () => {
            expect(formatPrice(200000)).toBe('200.000');
            expect(formatPrice(350000)).toBe('350.000');
            expect(formatPrice(500000)).toBe('500.000');
        });

        it('should handle large numbers', () => {
            expect(formatPrice(1234567890)).toBe('1.234.567.890');
        });

        // Test fallback behavior when Intl is not available
        describe('fallback behavior', () => {
            const originalIntl = global.Intl;

            beforeEach(() => {
                // @ts-ignore - Temporarily remove Intl to test fallback
                global.Intl = undefined;
            });

            afterEach(() => {
                global.Intl = originalIntl;
            });

            it('should use regex fallback when Intl is unavailable', () => {
                expect(formatPrice(1000000)).toBe('1.000.000');
            });
        });
    });

    describe('formatCurrency', () => {
        it('should append đ suffix to formatted price', () => {
            expect(formatCurrency(0)).toBe('0đ');
            expect(formatCurrency(1000)).toBe('1.000đ');
            expect(formatCurrency(200000)).toBe('200.000đ');
            expect(formatCurrency(1500000)).toBe('1.500.000đ');
        });

        it('should handle typical venue prices', () => {
            expect(formatCurrency(150000)).toBe('150.000đ');
            expect(formatCurrency(300000)).toBe('300.000đ');
            expect(formatCurrency(450000)).toBe('450.000đ');
        });
    });
});

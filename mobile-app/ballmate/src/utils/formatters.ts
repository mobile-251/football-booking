/**
 * Safe number formatting utilities for React Native
 * Provides fallback for environments where Intl API is not available (e.g., Hermes on Android)
 */

/**
 * Format a number as Vietnamese currency (VND)
 * @param price - The price to format
 * @returns Formatted string with thousand separators
 */
export function formatPrice(price: number): string {
	try {
		if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
			return new Intl.NumberFormat('vi-VN').format(price);
		}
	} catch {
		// fall through to fallback
	}

	// Fallback: add dots as thousand separators
	return String(price).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format a number as Vietnamese currency with 'đ' suffix
 * @param price - The price to format
 * @returns Formatted string with 'đ' suffix
 */
export function formatCurrency(price: number): string {
	return formatPrice(price) + 'đ';
}

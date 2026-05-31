export const COIN_VND_RATE = 1000;

export function vndToCoin(vnd: number): number {
	return Math.ceil(vnd / COIN_VND_RATE);
}

export function coinToVnd(coin: number): number {
	return coin * COIN_VND_RATE;
}

export function formatCoin(coin: number): string {
	return `${coin.toLocaleString('vi-VN')} coin`;
}

export function formatVnd(vnd: number): string {
	return `${vnd.toLocaleString('vi-VN')}₫`;
}

/** API pricing fields are still VND — display as coin in the app. */
export function formatVndAsCoin(vnd: number): string {
	return formatCoin(vndToCoin(vnd));
}

/** % thưởng so với coin cơ bản (baseCoin). */
export function coinBonusPercent(baseCoin: number, bonusCoin: number): number | null {
	if (!bonusCoin || bonusCoin <= 0 || !baseCoin || baseCoin <= 0) return null;
	return Math.round((bonusCoin / baseCoin) * 100);
}

export type TopUpPackageItem = {
	id: number;
	name: string;
	priceVnd: number;
	baseCoin: number;
	bonusCoin: number;
	totalCoin?: number;
	sortOrder?: number;
};

export function topUpTotalCoin(pkg: TopUpPackageItem): number {
	return pkg.totalCoin ?? pkg.baseCoin + (pkg.bonusCoin ?? 0);
}

export type ComboPackageItem = {
	id: number;
	venueId: number;
	fieldType: string;
	name: string;
	description?: string;
	matchCount: number;
	priceCoin: number;
	pricePerMatch?: number;
	validityDays: number;
	isActive?: boolean;
};

const FIELD_TYPE_LABELS: Record<string, string> = {
	FIELD_5VS5: 'Sân 5',
	FIELD_7VS7: 'Sân 7',
	FIELD_11VS11: 'Sân 11',
};

export function fieldTypeLabel(fieldType: string): string {
	return FIELD_TYPE_LABELS[fieldType] ?? fieldType;
}

/** Chuẩn hóa response API — priceCoin có thể là string (Decimal). */
export function normalizeComboPackage(raw: unknown): ComboPackageItem | null {
	if (!raw || typeof raw !== 'object') return null;
	const p = raw as Record<string, unknown>;
	const id = Number(p.id);
	if (!Number.isFinite(id)) return null;
	const matchCount = Number(p.matchCount);
	const priceCoin = Number(p.priceCoin);
	const validityDays = Number(p.validityDays);
	return {
		id,
		venueId: Number(p.venueId),
		fieldType: String(p.fieldType ?? ''),
		name: String(p.name ?? ''),
		description: p.description ? String(p.description) : undefined,
		matchCount: Number.isFinite(matchCount) ? matchCount : 0,
		priceCoin: Number.isFinite(priceCoin) ? priceCoin : 0,
		pricePerMatch: p.pricePerMatch != null ? Number(p.pricePerMatch) : undefined,
		validityDays: Number.isFinite(validityDays) ? validityDays : 0,
		isActive: p.isActive !== false,
	};
}

export function normalizeComboPackageList(data: unknown): ComboPackageItem[] {
	if (Array.isArray(data)) {
		return data.map(normalizeComboPackage).filter((x): x is ComboPackageItem => x != null);
	}
	if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
		return normalizeComboPackageList((data as { data: unknown }).data);
	}
	return [];
}

export function comboPerMatchCoin(pkg: ComboPackageItem): number {
	if (pkg.pricePerMatch != null && pkg.pricePerMatch > 0) return pkg.pricePerMatch;
	if (pkg.matchCount <= 0) return 0;
	return Math.round((pkg.priceCoin / pkg.matchCount) * 100) / 100;
}

export function extractNeedTopUp(err: unknown): { missingCoin: number; comboPackageId?: number } | null {
	const ax = err as {
		response?: { status?: number; data?: { missingCoin?: number; comboPackageId?: number } };
	};
	const status = ax.response?.status;
	const data = ax.response?.data;
	if (status !== 402 || data?.missingCoin == null) return null;
	return {
		missingCoin: Number(data.missingCoin),
		comboPackageId: data.comboPackageId != null ? Number(data.comboPackageId) : undefined,
	};
}

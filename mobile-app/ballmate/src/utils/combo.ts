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

export function hasActiveComboForPackage(
	combos: unknown[],
	packageId: number,
): boolean {
	if (!Array.isArray(combos)) return false;
	return combos.some((raw) => {
		if (!raw || typeof raw !== 'object') return false;
		const row = raw as {
			matchesRemaining?: number;
			comboPackageId?: number;
			comboPackage?: { id?: number };
		};
		const pkgId = row.comboPackage?.id ?? row.comboPackageId;
		return (
			pkgId === packageId &&
			(row.matchesRemaining == null || row.matchesRemaining > 0)
		);
	});
}

export function extractNeedTopUp(
	err: unknown,
): { missingCoin: number; missingVnd?: number; comboPackageId?: number } | null {
	const ax = err as {
		response?: {
			status?: number;
			data?: Record<string, unknown>;
		};
	};
	if (ax.response?.status !== 402) return null;

	const raw = ax.response.data;
	if (!raw || typeof raw !== 'object') return null;

	const nested =
		typeof raw.message === 'object' && raw.message != null
			? (raw.message as Record<string, unknown>)
			: raw;

	const missingCoin = Number(nested.missingCoin ?? raw.missingCoin);
	if (!Number.isFinite(missingCoin) || missingCoin <= 0) return null;

	const missingVndRaw = nested.missingVnd ?? raw.missingVnd;
	const missingVnd =
		missingVndRaw != null && Number.isFinite(Number(missingVndRaw))
			? Number(missingVndRaw)
			: undefined;

	const comboIdRaw = nested.comboPackageId ?? raw.comboPackageId;
	return {
		missingCoin,
		missingVnd,
		comboPackageId:
			comboIdRaw != null && Number.isFinite(Number(comboIdRaw))
				? Number(comboIdRaw)
				: undefined,
	};
}

const AMENITY_LABELS: Record<string, string> = {
	wifi: 'Wifi miễn phí',
	parking: 'Bãi đỗ xe',
	changing_room: 'Phòng thay đồ / Vệ sinh',
	lockers: 'Tủ đồ',
	canteen: 'Căn tin',
};

export function getAmenityLabel(key: string): string {
	return AMENITY_LABELS[key] ?? key;
}

export function getAmenityLabels(amenities?: string[] | null): string[] {
	if (!amenities?.length) return [];
	return amenities.map(getAmenityLabel);
}

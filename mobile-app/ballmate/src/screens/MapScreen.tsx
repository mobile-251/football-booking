import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	Image,
	ScrollView,
	Dimensions,
	ActivityIndicator,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { Field, FIELD_TYPE_LABELS, Venue } from '../types/types';
import { api } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatPrice } from '../utils/formatters';
import FieldMap from '../components/FieldMap';

const { width, height } = Dimensions.get('window');



interface FieldWithVenue extends Field {
	venue?: Venue;
	distance?: number;
	lat?: number;
	lng?: number;
}

type FilterType = 'all' | 'FIELD_5VS5' | 'FIELD_7VS7' | 'FIELD_11VS11';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
	{ key: 'all', label: 'Tất cả' },
	{ key: 'FIELD_5VS5', label: 'Sân 5' },
	{ key: 'FIELD_7VS7', label: 'Sân 7' },
	{ key: 'FIELD_11VS11', label: 'Sân 11' },
];

// Mock coordinates for Ho Chi Minh City area
const MOCK_LOCATIONS = [
	{ lat: 10.8505, lng: 106.7717 }, // Thu Duc
	{ lat: 10.7769, lng: 106.7009 }, // District 1
	{ lat: 10.8181, lng: 106.7241 }, // Binh Thanh
	{ lat: 10.8231, lng: 106.6297 }, // Go Vap
	{ lat: 10.8015, lng: 106.7139 }, // Phu Nhuan
	{ lat: 10.8724, lng: 106.7915 }, // Thu Duc 2
	{ lat: 10.7915, lng: 106.6836 }, // District 3
	{ lat: 10.8411, lng: 106.7568 }, // District 9
];

export default function MapScreen() {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const [searchQuery, setSearchQuery] = useState('');
	const [activeFilter, setActiveFilter] = useState<FilterType>('all');
	const [fields, setFields] = useState<FieldWithVenue[]>([]);
	const [filteredFields, setFilteredFields] = useState<FieldWithVenue[]>([]);
	const [selectedField, setSelectedField] = useState<FieldWithVenue | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadFields();
	}, []);

	useEffect(() => {
		filterFields();
	}, [fields, activeFilter, searchQuery]);

	const loadFields = async () => {
		try {
			setLoading(true);
			console.log('[MapScreen] Loading fields...');
			const data = await api.getFields();
			console.log('[MapScreen] Received fields:', data?.length);
			// Add mock coordinates and distance
			const fieldsWithLocation = data.map((field, index) => {
				const loc = MOCK_LOCATIONS[index % MOCK_LOCATIONS.length];
				return {
					...field,
					lat: loc.lat + (Math.random() - 0.5) * 0.02,
					lng: loc.lng + (Math.random() - 0.5) * 0.02,
					distance: Math.round(Math.random() * 10 * 10) / 10,
				};
			});
			setFields(fieldsWithLocation);
			console.log('[MapScreen] Fields loaded successfully');
		} catch (error) {
			console.error('[MapScreen] Error loading fields:', error);
			// Mock data with locations
			setFields([
				{
					id: 1,
					name: 'Sân Bóng mini Bắc Rạch Chiếc',
					venueId: 1,
					fieldType: 'FIELD_5VS5',
					pricePerHour: 200000,
					images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400'],
					isActive: true,
					createdAt: '',
					updatedAt: '',
					distance: 6.7,
					lat: 10.8505,
					lng: 106.7717,
					venue: {
						id: 1,
						name: 'Sân Bắc Rạch Chiếc',
						address: 'Đường 410, Phước Long A, Quận 9, TP.HCM',
						city: 'TP.HCM',
						openTime: '05:00',
						closeTime: '24:00',
						facilities: [],
						images: [],
						ownerId: 1,
						isActive: true,
						createdAt: '',
						updatedAt: '',
					},
				},
				{
					id: 2,
					name: 'Sân 7 người Thủ Đức',
					venueId: 2,
					fieldType: 'FIELD_7VS7',
					pricePerHour: 350000,
					images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400'],
					isActive: true,
					createdAt: '',
					updatedAt: '',
					distance: 3.2,
					lat: 10.7769,
					lng: 106.7009,
					venue: {
						id: 2,
						name: 'Khu thể thao Thủ Đức',
						address: '123 Võ Văn Ngân, Thủ Đức, TP.HCM',
						city: 'TP.HCM',
						openTime: '06:00',
						closeTime: '22:00',
						facilities: [],
						images: [],
						ownerId: 2,
						isActive: true,
						createdAt: '',
						updatedAt: '',
					},
				},
				{
					id: 3,
					name: 'Sân 11 người cao cấp',
					venueId: 3,
					fieldType: 'FIELD_11VS11',
					pricePerHour: 500000,
					images: ['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400'],
					isActive: true,
					createdAt: '',
					updatedAt: '',
					distance: 4.5,
					lat: 10.8181,
					lng: 106.7241,
					venue: {
						id: 3,
						name: 'CLB Bóng đá Quận 7',
						address: '456 Nguyễn Thị Thập, Quận 7, TP.HCM',
						city: 'TP.HCM',
						openTime: '05:00',
						closeTime: '23:00',
						facilities: [],
						images: [],
						ownerId: 3,
						isActive: true,
						createdAt: '',
						updatedAt: '',
					},
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const filterFields = () => {
		let result = [...fields];

		if (activeFilter !== 'all') {
			result = result.filter((f) => f.fieldType === activeFilter);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(f) => f.name.toLowerCase().includes(query) || f.venue?.address?.toLowerCase().includes(query)
			);
		}

		setFilteredFields(result);
	};

	const getFieldCount = (type: FilterType) => {
		if (type === 'all') return fields.length;
		return fields.filter((f) => f.fieldType === type).length;
	};

	const handleViewDetails = (field: FieldWithVenue) => {
		navigation.navigate('FieldDetail', { fieldId: field.id });
	};

	const handleMarkerClick = (fieldId: number) => {
		const field = filteredFields.find((f) => f.id === fieldId);
		if (field) {
			setSelectedField(field);
		}
	};

	// Convert fields to map markers format
	const mapFields = filteredFields
		.filter((f) => f.lat && f.lng)
		.map((f) => ({
			id: f.id,
			name: f.name,
			lat: f.lat!,
			lng: f.lng!,
			price: f.pricePerHour,
			address: f.venue?.address,
		}));

	return (
		<View style={styles.container}>
			{/* Map */}
			<View style={styles.mapContainer}>
				<FieldMap
					fields={mapFields}
					selectedFieldId={selectedField?.id}
					onMarkerClick={handleMarkerClick}
					center={[10.8231, 106.7009]}
					zoom={12}
				/>
			</View>

			{/* Search Bar */}
			<SafeAreaView style={styles.searchContainer} edges={['top']}>
				<View style={styles.searchBar}>
					<Ionicons name='search' size={20} color={theme.colors.foregroundMuted} />
					<TextInput
						style={styles.searchInput}
						placeholder='Tìm sân bóng đá...'
						placeholderTextColor={theme.colors.foregroundMuted}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity onPress={() => setSearchQuery('')}>
							<Ionicons name='close-circle' size={20} color={theme.colors.foregroundMuted} />
						</TouchableOpacity>
					)}
				</View>
				<TouchableOpacity style={styles.filterButton}>
					<Ionicons name='options' size={22} color={theme.colors.white} />
				</TouchableOpacity>
			</SafeAreaView>

			{/* Search Results Count */}
			{searchQuery.length > 0 && (
				<View style={styles.resultsCount}>
					<Text style={styles.resultsText}>{filteredFields.length} sân được tìm thấy</Text>
				</View>
			)}

			{/* Filter Chips */}
			<View style={styles.filterContainer}>
				<Text style={styles.filterLabel}>Loại sân</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
					{FILTER_OPTIONS.map((option) => (
						<TouchableOpacity
							key={option.key}
							style={[styles.filterChip, activeFilter === option.key && styles.filterChipActive]}
							onPress={() => setActiveFilter(option.key)}
						>
							<Text style={[styles.filterChipText, activeFilter === option.key && styles.filterChipTextActive]}>
								{option.label}
							</Text>
							<View style={[styles.filterChipBadge, activeFilter === option.key && styles.filterChipBadgeActive]}>
								<Text
									style={[styles.filterChipBadgeText, activeFilter === option.key && styles.filterChipBadgeTextActive]}
								>
									{getFieldCount(option.key)}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Legend */}
			<View style={styles.legend}>
				<Text style={styles.legendTitle}>Chú thích</Text>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]}>
						<Text style={{ fontSize: 10 }}>⚽</Text>
					</View>
					<Text style={styles.legendText}>Sân đang chọn</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#4ade80' }]}>
						<Text style={{ fontSize: 10 }}>⚽</Text>
					</View>
					<Text style={styles.legendText}>Sân khác</Text>
				</View>
			</View>

			{/* GPS Button */}
			<TouchableOpacity style={styles.gpsButton}>
				<Ionicons name='navigate' size={24} color={theme.colors.white} />
			</TouchableOpacity>

			{/* Selected Field Card */}
			{selectedField && (
				<View style={styles.fieldCard}>
					<TouchableOpacity style={styles.fieldCardClose} onPress={() => setSelectedField(null)}>
						<Ionicons name='close' size={20} color={theme.colors.foregroundMuted} />
					</TouchableOpacity>

					<Image
						source={{
							uri: selectedField.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400',
						}}
						style={styles.fieldCardImage}
						resizeMode='cover'
					/>

					<View style={styles.fieldCardContent}>
						<Text style={styles.fieldCardName}>{selectedField.name}</Text>

						<View style={styles.fieldCardRating}>
							<Ionicons name='star' size={14} color='#f59e0b' />
							<Text style={styles.fieldCardRatingText}>4.7</Text>
							<Text style={styles.fieldCardDistance}>• {selectedField.distance}km</Text>
						</View>

						<View style={styles.fieldCardAddress}>
							<Ionicons name='location-outline' size={14} color={theme.colors.foregroundMuted} />
							<Text style={styles.fieldCardAddressText} numberOfLines={2}>
								{selectedField.venue?.address}
							</Text>
						</View>

						<View style={styles.fieldCardFooter}>
							<Text style={styles.fieldCardPrice}>
								{formatPrice(selectedField.pricePerHour)}đ<Text style={styles.fieldCardPriceUnit}>/giờ</Text>
							</Text>
							<TouchableOpacity style={styles.fieldCardButton} onPress={() => handleViewDetails(selectedField)}>
								<Text style={styles.fieldCardButtonText}>Xem chi tiết</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			)}

			{/* Loading */}
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size='large' color={theme.colors.primary} />
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	mapContainer: {
		...StyleSheet.absoluteFillObject,
	},
	mapPlaceholder: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e8f4e8',
	},
	placeholderText: {
		marginTop: 16,
		fontSize: 14,
		color: theme.colors.foregroundMuted,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f0f0f0',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: theme.colors.foregroundMuted,
	},
	gpsButton: {
		position: 'absolute',
		right: 16,
		bottom: 200,
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		...theme.shadows.medium,
	},
	searchContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		gap: 10,
		zIndex: 1000,
	},
	searchBar: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.full,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm : 0,
		gap: 10,
		...theme.shadows.soft,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		color: theme.colors.foreground,
		paddingVertical: Platform.OS === 'android' ? 10 : 0,
	},
	filterButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		...theme.shadows.soft,
	},
	resultsCount: {
		position: 'absolute',
		top: 110,
		left: theme.spacing.lg,
		backgroundColor: theme.colors.white,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.sm,
		zIndex: 1000,
		...theme.shadows.soft,
	},
	resultsText: {
		fontSize: 13,
		color: theme.colors.foreground,
	},
	filterContainer: {
		position: 'absolute',
		top: 110,
		left: 0,
		right: 0,
		paddingLeft: theme.spacing.lg,
		zIndex: 1000,
	},
	filterLabel: {
		fontSize: 13,
		color: theme.colors.foreground,
		marginBottom: 8,
		backgroundColor: 'rgba(255,255,255,0.9)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		alignSelf: 'flex-start',
	},
	filterScroll: {
		flexDirection: 'row',
	},
	filterChip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.white,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 8,
		borderRadius: theme.borderRadius.full,
		marginRight: 8,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	filterChipActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	filterChipText: {
		fontSize: 13,
		color: theme.colors.foreground,
		marginRight: 6,
	},
	filterChipTextActive: {
		color: theme.colors.white,
	},
	filterChipBadge: {
		backgroundColor: theme.colors.background,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
	},
	filterChipBadgeActive: {
		backgroundColor: 'rgba(255,255,255,0.3)',
	},
	filterChipBadgeText: {
		fontSize: 11,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	filterChipBadgeTextActive: {
		color: theme.colors.white,
	},
	legend: {
		position: 'absolute',
		bottom: 180,
		left: theme.spacing.lg,
		backgroundColor: theme.colors.white,
		padding: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		zIndex: 1000,
		...theme.shadows.soft,
	},
	legendTitle: {
		fontSize: 12,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginBottom: 8,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	legendDot: {
		width: 24,
		height: 24,
		borderRadius: 12,
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: theme.colors.white,
	},
	legendText: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	fieldCard: {
		position: 'absolute',
		bottom: 100,
		left: theme.spacing.lg,
		right: theme.spacing.lg,
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		overflow: 'hidden',
		zIndex: 1000,
		...theme.shadows.medium,
	},
	fieldCardClose: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 10,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: theme.colors.white,
		justifyContent: 'center',
		alignItems: 'center',
	},
	fieldCardImage: {
		width: '100%',
		height: 140,
		backgroundColor: theme.colors.background,
	},
	fieldCardContent: {
		padding: theme.spacing.md,
	},
	fieldCardName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: 4,
	},
	fieldCardRating: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	fieldCardRatingText: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginLeft: 4,
	},
	fieldCardDistance: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginLeft: 4,
	},
	fieldCardAddress: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 6,
		marginBottom: theme.spacing.md,
	},
	fieldCardAddressText: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		lineHeight: 18,
	},
	fieldCardFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	fieldCardPrice: {
		fontSize: 18,
		fontWeight: 'bold',
		color: theme.colors.primary,
	},
	fieldCardPriceUnit: {
		fontSize: 13,
		fontWeight: 'normal',
		color: theme.colors.foregroundMuted,
	},
	fieldCardButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.md,
	},
	fieldCardButtonText: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.white,
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255,255,255,0.8)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 2000,
	},
});

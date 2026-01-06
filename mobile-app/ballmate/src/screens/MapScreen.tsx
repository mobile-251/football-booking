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

// Default coordinates for Ho Chi Minh City center
const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 };

export default function MapScreen() {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const [searchQuery, setSearchQuery] = useState('');
	const [activeFilter, setActiveFilter] = useState<FilterType>('all');
	const [fields, setFields] = useState<FieldWithVenue[]>([]);
	const [filteredFields, setFilteredFields] = useState<FieldWithVenue[]>([]);
	const [selectedField, setSelectedField] = useState<FieldWithVenue | null>(null);
	const [loading, setLoading] = useState(true);
	const [showFilters, setShowFilters] = useState(true);

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
			// Use venue coordinates from API - filter out fields without valid coordinates
			const fieldsWithLocation = data
				.filter((field) => field.venue?.latitude && field.venue?.longitude)
				.map((field) => ({
					...field,
					lat: field.venue!.latitude,
					lng: field.venue!.longitude,
					// Distance would require user location - showing placeholder for now
					distance: undefined,
				}));
			setFields(fieldsWithLocation);
			console.log('[MapScreen] Fields with valid coordinates:', fieldsWithLocation.length);
		} catch (error) {
			console.error('[MapScreen] Error loading fields:', error);
			// No mock data - show empty state
			setFields([]);
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
				<View style={styles.searchRow}>
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
					<TouchableOpacity
						style={[styles.filterButton, showFilters && styles.filterButtonActive]}
						onPress={() => setShowFilters(!showFilters)}
					>
						<Ionicons name='options' size={22} color={theme.colors.white} />
					</TouchableOpacity>
				</View>

				{/* Filter Chips - Right below search */}
				{showFilters && (
					<View style={styles.filterChipsRow}>
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
				)}

				{/* Search Results Dropdown */}
				{searchQuery.length > 0 && filteredFields.length > 0 && (
					<View style={styles.searchDropdown}>
						<Text style={styles.searchDropdownHeader}>{filteredFields.length} sân được tìm thấy</Text>
						<ScrollView style={styles.searchDropdownList} nestedScrollEnabled>
							{filteredFields.slice(0, 5).map((field) => (
								<TouchableOpacity
									key={field.id}
									style={styles.searchDropdownItem}
									onPress={() => {
										setSelectedField(field);
										setSearchQuery('');
									}}
								>
									<View style={styles.searchDropdownIcon}>
										<Ionicons name='football-outline' size={20} color={theme.colors.primary} />
									</View>
									<View style={styles.searchDropdownContent}>
										<Text style={styles.searchDropdownTitle}>{field.name}</Text>
										<Text style={styles.searchDropdownSubtitle} numberOfLines={1}>
											{field.venue?.address || 'Sân bóng'}
										</Text>
									</View>
									<Ionicons name='chevron-forward' size={18} color={theme.colors.foregroundMuted} />
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				)}
			</SafeAreaView>

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
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		zIndex: 1000,
	},
	searchRow: {
		flexDirection: 'row',
		gap: 10,
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
	filterButtonActive: {
		borderWidth: 2,
		borderColor: theme.colors.white,
	},
	filterChipsRow: {
		marginTop: theme.spacing.sm,
	},
	searchDropdown: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		marginTop: theme.spacing.sm,
		...theme.shadows.medium,
		overflow: 'hidden',
	},
	searchDropdownHeader: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	searchDropdownList: {
		maxHeight: 250,
	},
	searchDropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	searchDropdownIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: theme.colors.primary + '20',
		justifyContent: 'center',
		alignItems: 'center',
	},
	searchDropdownContent: {
		flex: 1,
		marginLeft: theme.spacing.md,
	},
	searchDropdownTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	searchDropdownSubtitle: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		marginTop: 2,
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

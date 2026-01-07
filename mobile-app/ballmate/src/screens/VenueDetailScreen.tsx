import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { VenueDetail, FIELD_TYPE_LABELS, Review, FieldWithPricing, Field } from '../types/types';
import { api } from '../services/api';
import { formatPrice } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import BookingModal from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';

type VenueDetailRouteProp = RouteProp<RootStackParamList, 'VenueDetail'>;

const { width } = Dimensions.get('window');

type TabType = 'images' | 'reviews' | 'terms';

const TERMS = {
	booking: [
		'Đặt cọc trước 30% giá trị sân',
		'Hủy trong vòng 24h mất cọc',
		'Đến muộn quá 15 phút mất quyền sử dụng sân',
		'Hủy trước 24h được hoàn 100% cọc',
	],
	usage: [
		'Giữ gìn sạch sẽ khu vực sân',
		'Không mang đồ ăn có mùi lên sân',
		'Báo cáo nếu phát hiện hư hỏng',
		'Trả lại thiết bị mượn trước khi rời sân',
	],
};

export default function VenueDetailScreen() {
	const route = useRoute<VenueDetailRouteProp>();
	const navigation = useNavigation();
	const { isAuthenticated } = useAuth();
	const { venueId } = route.params;
	const [venue, setVenue] = useState<VenueDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabType>('images');
	const [reviews, setReviews] = useState<Review[]>([]); // Currently fetching from venue.fields aggregation or separate API? 
	// Note: API implementation for getReviews(venueId) might be needed if we want venue-level reviews, 
	// but currently we can aggregate from fields or just show empty if API doesn't support venue-level yet.
	// For now, let's use the reviews aggregated in the backend if available, or just empty. 
	// The backend return `averageRating` and `totalReviews` but not the list itself in `VenueDetail`.
	// We'll skip fetching detailed review list for now or fetch properly if needed. 
	// Let's assume we show stats mostly.

	const [showBookingModal, setShowBookingModal] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [favoriteLoading, setFavoriteLoading] = useState(false);

	useEffect(() => {
		loadVenue();
	}, [venueId]);

	const loadVenue = async () => {
		try {
			setLoading(true);
			const data = await api.getVenue(venueId);
			setVenue(data);
		} catch (error) {
			console.error('Failed to load venue:', error);
		} finally {
			setLoading(false);
		}
	};

	const getUniqueFieldTypes = () => {
		if (!venue?.fields) return [];
		const types = new Set(venue.fields.map(f => f.fieldType));
		const order: Record<string, number> = { 'FIELD_5VS5': 1, 'FIELD_7VS7': 2, 'FIELD_11VS11': 3 };
		return Array.from(types).sort((a, b) => (order[a] || 99) - (order[b] || 99));
	};

	const renderPriceTable = () => {
		if (!venue?.fields) return null;

		const fieldTypes = getUniqueFieldTypes();

		return (
			<View style={styles.priceTableContainer}>
				<View style={styles.sectionHeader}>
					<Ionicons name='pricetag' size={20} color={theme.colors.primary} />
					<Text style={styles.sectionTitle}>Bảng giá</Text>
				</View>

				{fieldTypes.map((type) => {
					// Find a representative field for this type to get pricing
					const field = venue?.fieldsPricings?.find(f => f.fieldType === type);
					if (!field) return null;

					// Process pricings into rows
					// We assume pricing structure is consistent for the type
					// Group by time slots
					const weekdayPricings = field.pricings.filter(p => p.dayType === 'WEEKDAY');
					const weekendPricings = field.pricings.filter(p => p.dayType === 'WEEKEND');

					// Create a map of time -> prices
					const priceMap = new Map<string, { weekday?: number; weekend?: number }>();

					weekdayPricings.forEach(p => {
						const key = `${p.startTime.substring(0, 5)} - ${p.endTime.substring(0, 5)}`;
						const current = priceMap.get(key) || {};
						priceMap.set(key, { ...current, weekday: p.price });
					});

					weekendPricings.forEach(p => {
						const key = `${p.startTime.substring(0, 5)} - ${p.endTime.substring(0, 5)}`;
						const current = priceMap.get(key) || {};
						priceMap.set(key, { ...current, weekend: p.price });
					});

					const rows = Array.from(priceMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

					return (
						<View key={type} style={styles.typePriceContainer}>
							<Text style={styles.typeHeader}>{FIELD_TYPE_LABELS[type]}</Text>

							{/* Table Header */}
							<View style={styles.tableHeader}>
								<View style={[styles.tableCell, styles.tableCellFirst]}>
									<Ionicons name='time-outline' size={16} color={theme.colors.primary} />
								</View>
								<Text style={[styles.tableHeaderText, styles.tableCell]}>T2-T6</Text>
								<Text style={[styles.tableHeaderText, styles.tableCell]}>T7-CN</Text>
							</View>

							{/* Rows */}
							{rows.map(([time, prices], index) => (
								<View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
									<Text style={[styles.tableTime, styles.tableCellFirst]}>{time}</Text>
									<Text style={styles.tableCellPrice}>
										{prices.weekday ? `${prices.weekday / 1000}k` : '-'}
									</Text>
									<Text style={styles.tableCellPrice}>
										{prices.weekend ? `${prices.weekend / 1000}k` : '-'}
									</Text>
								</View>
							))}
						</View>
					);
				})}
			</View>
		);
	};


	const renderTabs = () => (
		<View style={styles.tabContainer}>
			<TouchableOpacity
				style={[styles.tab, activeTab === 'images' && styles.tabActive]}
				onPress={() => setActiveTab('images')}
			>
				<Ionicons
					name='images-outline'
					size={18}
					color={activeTab === 'images' ? theme.colors.primary : theme.colors.foregroundMuted}
				/>
				<Text style={[styles.tabText, activeTab === 'images' && styles.tabTextActive]}>Hình ảnh</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
				onPress={() => setActiveTab('reviews')}
			>
				<Ionicons
					name='star-outline'
					size={18}
					color={activeTab === 'reviews' ? theme.colors.primary : theme.colors.foregroundMuted}
				/>
				<Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>Đánh giá</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
				onPress={() => setActiveTab('terms')}
			>
				<Ionicons
					name='document-text-outline'
					size={18}
					color={activeTab === 'terms' ? theme.colors.primary : theme.colors.foregroundMuted}
				/>
				<Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>Điều khoản</Text>
			</TouchableOpacity>
		</View>
	);

	const renderImageGallery = () => (
		<View style={styles.galleryContainer}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				{(venue?.images && venue.images.length > 0
					? venue.images
					: [
						'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
						'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
					]
				).map((uri, index) => (
					<Image key={index} source={{ uri }} style={styles.galleryImage} resizeMode='cover' />
				))}
			</ScrollView>
		</View>
	);

	const renderTerms = () => (
		<View style={styles.termsContainer}>
			<View style={styles.termsSection}>
				<View style={styles.termsSectionHeader}>
					<View style={styles.termsIcon}>
						<Ionicons name='clipboard-outline' size={20} color={theme.colors.primary} />
					</View>
					<Text style={styles.termsSectionTitle}>Quy định đặt sân</Text>
				</View>
				{TERMS.booking.map((term, index) => (
					<View key={index} style={styles.termItem}>
						<Ionicons name='checkmark-circle' size={18} color={theme.colors.primary} />
						<Text style={styles.termText}>{term}</Text>
					</View>
				))}
			</View>

			<View style={styles.termsSection}>
				<View style={styles.termsSectionHeader}>
					<View style={styles.termsIcon}>
						<Ionicons name='document-text-outline' size={20} color={theme.colors.primary} />
					</View>
					<Text style={styles.termsSectionTitle}>Quy định sử dụng sân</Text>
				</View>
				{TERMS.usage.map((term, index) => (
					<View key={index} style={styles.termItem}>
						<Ionicons name='checkmark-circle' size={18} color={theme.colors.primary} />
						<Text style={styles.termText}>{term}</Text>
					</View>
				))}
			</View>
		</View>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case 'images':
				return renderImageGallery();
			case 'reviews':
				return (
					<View style={styles.reviewsContainer}>
						<View style={styles.reviewSummary}>
							<View style={styles.ratingBig}>
								<Text style={styles.ratingBigNumber}>{venue?.averageRating || 0}</Text>
								<Ionicons name='star' size={24} color='#f59e0b' />
							</View>
							<Text style={styles.reviewCount}>{venue?.totalReviews || 0} đánh giá</Text>
						</View>
						<Text style={{ textAlign: 'center', color: theme.colors.foregroundMuted }}>
							Chi tiết đánh giá xem tại từng sân
						</Text>
					</View>
				);
			case 'terms':
				return renderTerms();
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={theme.colors.primary} />
			</View>
		);
	}

	if (!venue) {
		return (
			<View style={styles.loadingContainer}>
				<Text>Không tìm thấy sân</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Main Image */}
				<Image
					source={{ uri: venue.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800' }}
					style={styles.mainImage}
					resizeMode='cover'
				/>

				{/* Content */}
				<View style={styles.content}>
					{/* Title */}
					<View style={styles.titleRow}>
						<View style={styles.titleInfo}>
							<Text style={styles.venueName}>{venue.name}</Text>
							<Text style={styles.activeFieldText}>{venue.activeFieldCount} sân hoạt động</Text>
						</View>
						<TouchableOpacity style={styles.favoriteBtn}>
							<Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={theme.colors.accent} />
						</TouchableOpacity>
					</View>

					{/* Rating */}
					<View style={styles.ratingRow}>
						<Ionicons name='star' size={16} color='#f59e0b' />
						<Text style={styles.ratingText}>{venue.averageRating || 0}</Text>
						<Text style={styles.reviewCountSmall}>({venue.totalReviews} đánh giá)</Text>
					</View>

					{/* Location */}
					<View style={styles.infoCard}>
						<View style={styles.infoHeader}>
							<Ionicons name='location' size={20} color={theme.colors.primary} />
							<Text style={styles.infoTitle}>Địa chỉ</Text>
						</View>
						<Text style={styles.infoValue}>
							{venue.address}, {venue.district}, {venue.city}
						</Text>
					</View>

					{/* Contact */}
					<View style={styles.infoCard}>
						<View style={styles.contactRow}>
							<View style={styles.contactItem}>
								<Ionicons name='call-outline' size={18} color={theme.colors.primary} />
								<Text style={styles.contactText}>{venue.phoneNumber || 'Liên hệ'}</Text>
							</View>
							<View style={styles.contactItem}>
								<Ionicons name='time-outline' size={18} color={theme.colors.primary} />
								<Text style={styles.contactText}>
									{venue.openTime} - {venue.closeTime}
								</Text>
							</View>
						</View>
					</View>

					{/* Price Table via Field Types */}
					{renderPriceTable()}


					{/* Facilities */}
					<View style={styles.infoCard}>
						<View style={styles.infoHeader}>
							<Ionicons name='grid' size={20} color={theme.colors.primary} />
							<Text style={styles.infoTitle}>Tiện ích</Text>
						</View>
						<View style={styles.facilitiesRow}>
							{venue.facilities?.length > 0 ? (
								venue.facilities.map((facility, index) => (
									<View key={index} style={styles.facilityTag}>
										<Text style={styles.facilityText}>{facility}</Text>
									</View>
								))
							) : (
								<Text style={styles.infoValue}>Đang cập nhật...</Text>
							)}
						</View>
					</View>

					{/* Description */}
					<View style={styles.infoCard}>
						<View style={styles.infoHeader}>
							<Ionicons name='information-circle' size={20} color={theme.colors.primary} />
							<Text style={styles.infoTitle}>Mô tả</Text>
						</View>
						<Text style={styles.description}>{venue.description || 'Chưa có mô tả'}</Text>
					</View>

					{/* Tabs */}
					{renderTabs()}
					{renderTabContent()}
				</View>
			</ScrollView>

			{/* Bottom Bar */}
			<View style={styles.bottomBar}>
				<View style={styles.priceInfo}>
					<Text style={styles.priceLabel}>Giá từ</Text>
					<Text style={styles.price}>
						{formatPrice(venue.minPrice)}đ<Text style={styles.priceUnit}>/giờ</Text>
					</Text>
				</View>
				<TouchableOpacity
					style={styles.bookButton}
					onPress={() => setShowBookingModal(true)}
				>
					<Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
				</TouchableOpacity>
			</View>

			{/* Booking Modal */}
			{venue.fields && venue.fields.length > 0 && (
				<BookingModal
					visible={showBookingModal}
					onClose={() => setShowBookingModal(false)}
					field={
						{
							...venue.fieldsPricings[0],
							pricePerHour: Math.min(...(venue.fieldsPricings[0].pricings?.map((p) => p.price) || [0])),
							description: venue.description || '',
							images: venue.images || [],
							venue: venue,
							reviews: [],
						} as unknown as Field
					}
					onBookingSuccess={() => {
						setShowBookingModal(false);
					}}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	mainImage: {
		width: width,
		height: 250,
	},
	content: {
		padding: theme.spacing.lg,
	},
	titleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.sm,
	},
	titleInfo: {
		flex: 1,
		marginRight: theme.spacing.md,
	},
	venueName: {
		fontSize: 22,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: 4,
	},
	activeFieldText: {
		fontSize: 13,
		color: theme.colors.primary,
		fontWeight: '600',
	},
	favoriteBtn: {
		padding: 4,
	},
	ratingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginBottom: theme.spacing.lg,
	},
	ratingText: {
		fontSize: 14,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	reviewCountSmall: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	infoCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		...theme.shadows.soft,
	},
	infoHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: theme.spacing.sm,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	infoValue: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		lineHeight: 20,
	},
	contactRow: {
		flexDirection: 'row',
		gap: 24,
	},
	contactItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	contactText: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	// Price Table Styles
	priceTableContainer: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		...theme.shadows.soft,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: theme.spacing.md,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	typePriceContainer: {
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.md,
	},
	typeHeader: {
		fontSize: 14,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.sm,
		// paddingLeft: 4,
	},
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.sm,
		paddingVertical: theme.spacing.sm,
	},
	tableHeaderText: {
		color: theme.colors.white,
		fontSize: 12,
		fontWeight: '600',
		textAlign: 'center',
	},
	tableCell: {
		flex: 1,
		textAlign: 'center',
		justifyContent: 'center',
		alignItems: 'center',
	},
	tableCellFirst: {
		flex: 1.2,
	},
	tableRow: {
		flexDirection: 'row',
		paddingVertical: theme.spacing.sm,
		alignItems: 'center',
	},
	tableRowAlt: {
		backgroundColor: theme.colors.background,
	},
	tableTime: {
		fontSize: 12,
		color: theme.colors.foreground,
		fontWeight: '500',
	},
	tableCellPrice: {
		flex: 1,
		fontSize: 12,
		color: theme.colors.foreground,
		textAlign: 'center',
	},
	// Fields List Styles
	sectionContainer: {
		marginBottom: theme.spacing.md,
	},
	fieldItem: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.xs,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		...theme.shadows.soft,
	},
	fieldInfo: {
		flex: 1,
	},
	fieldNameItem: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginBottom: 2,
	},
	fieldTypeItem: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	fieldStats: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginRight: theme.spacing.sm,
	},
	fieldStatText: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	// Utils
	facilitiesRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	facilityTag: {
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 6,
		borderRadius: theme.borderRadius.sm,
	},
	facilityText: {
		fontSize: 12,
		color: theme.colors.foreground,
	},
	description: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		lineHeight: 22,
	},
	// Tab
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: 4,
		marginBottom: theme.spacing.md,
	},
	tab: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.sm,
	},
	tabActive: {
		backgroundColor: theme.colors.primary + '15',
	},
	tabText: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	tabTextActive: {
		color: theme.colors.primary,
		fontWeight: '600',
	},
	galleryContainer: {
		marginBottom: theme.spacing.md,
	},
	galleryImage: {
		width: width * 0.7,
		height: 200,
		borderRadius: theme.borderRadius.md,
		marginRight: theme.spacing.md,
	},
	// Reviews
	reviewsContainer: {
		marginBottom: theme.spacing.md,
	},
	reviewSummary: {
		alignItems: 'center',
		marginBottom: theme.spacing.lg,
	},
	ratingBig: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	ratingBigNumber: {
		fontSize: 36,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	reviewCount: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		marginTop: 4,
	},
	// Terms
	termsContainer: {
		backgroundColor: theme.colors.primary + '10',
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
	},
	termsSection: {
		marginBottom: theme.spacing.lg,
	},
	termsSectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: theme.spacing.md,
	},
	termsIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: theme.colors.primary + '20',
		justifyContent: 'center',
		alignItems: 'center',
	},
	termsSectionTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	termItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		marginBottom: theme.spacing.sm,
	},
	termText: {
		flex: 1,
		fontSize: 14,
		color: theme.colors.foreground,
		lineHeight: 20,
	},
	// Bottom
	bottomBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.white,
		padding: theme.spacing.lg,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		...theme.shadows.medium,
	},
	priceInfo: {},
	priceLabel: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	price: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.primary,
	},
	priceUnit: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		fontWeight: 'normal',
	},
	bookButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: theme.borderRadius.md,
		alignItems: 'center',
	},
	bookButtonText: {
		color: theme.colors.white,
		fontWeight: '600',
		fontSize: 14,
	},
});

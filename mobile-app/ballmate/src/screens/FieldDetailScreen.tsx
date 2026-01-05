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
	FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { Field, FIELD_TYPE_LABELS, Review } from '../types/types';
import { api } from '../services/api';
import { formatPrice } from '../utils/formatters';
import { RootStackParamList } from '../navigation/AppNavigator';
import BookingModal from '../components/BookingModal';

type FieldDetailRouteProp = RouteProp<RootStackParamList, 'FieldDetail'>;

const { width } = Dimensions.get('window');

type TabType = 'images' | 'reviews' | 'terms';

interface PriceRow {
	time: string;
	weekday: number;
	friday: number;
	saturday: number;
	sunday: number;
}

const PRICE_TABLE: PriceRow[] = [
	{ time: '05h - 08h', weekday: 300000, friday: 350000, saturday: 400000, sunday: 400000 },
	{ time: '08h - 15h', weekday: 250000, friday: 300000, saturday: 350000, sunday: 350000 },
	{ time: '15h - 17h', weekday: 350000, friday: 400000, saturday: 450000, sunday: 450000 },
	{ time: '17h - 22h', weekday: 500000, friday: 550000, saturday: 600000, sunday: 600000 },
	{ time: '22h - 24h', weekday: 350000, friday: 400000, saturday: 450000, sunday: 450000 },
];

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

export default function FieldDetailScreen() {
	const route = useRoute<FieldDetailRouteProp>();
	const navigation = useNavigation();
	const { fieldId } = route.params;
	const [field, setField] = useState<Field | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabType>('images');
	const [reviews, setReviews] = useState<Review[]>([]);
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);

	useEffect(() => {
		loadField();
		loadReviews();
	}, [fieldId]);

	const loadField = async () => {
		try {
			setLoading(true);
			const data = await api.getField(fieldId);
			setField(data);
		} catch (error) {
			console.error('Failed to load field:', error);
			// Mock data
			setField({
				id: fieldId,
				name: 'Sân bóng mini Bắc Rạch Chiếc',
				venueId: 1,
				fieldType: 'FIELD_5VS5',
				pricePerHour: 200000,
				description:
					'Sân cỏ nhân tạo chất lượng cao, được bảo trì thường xuyên. Có đèn chiếu sáng cho các trận đấu buổi tối. Không gian rộng rãi, thoáng mát.',
				images: [
					'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
					'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
					'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
				],
				isActive: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				venue: {
					id: 1,
					name: 'Khu thể thao Rạch Chiếc',
					address: 'Đường 410, Phước Long A, Quận 9, TP.HCM',
					city: 'TP.HCM',
					openTime: '05:00',
					closeTime: '24:00',
					facilities: ['Bãi đỗ xe', 'Phòng tắm', 'Căng tin', 'Wifi'],
					images: [],
					ownerId: 1,
					isActive: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			});
		} finally {
			setLoading(false);
		}
	};

	const loadReviews = async () => {
		try {
			const data = await api.getReviews(fieldId);
			setReviews(data);
		} catch (error) {
			// Mock reviews
			setReviews([
				{
					id: 1,
					fieldId,
					playerId: 1,
					rating: 5,
					comment: 'Sân đẹp, mặt cỏ tốt, đèn sáng. Rất hài lòng!',
					createdAt: '2025-12-20T10:00:00Z',
					updatedAt: '',
				},
				{
					id: 2,
					fieldId,
					playerId: 2,
					rating: 4,
					comment: 'Sân ổn, nhân viên nhiệt tình. Bãi đỗ xe hơi chật.',
					createdAt: '2025-12-18T14:00:00Z',
					updatedAt: '',
				},
				{
					id: 3,
					fieldId,
					playerId: 3,
					rating: 5,
					comment: 'Giá cả hợp lý, sân chất lượng cao.',
					createdAt: '2025-12-15T16:00:00Z',
					updatedAt: '',
				},
			]);
		}
	};

	const getAverageRating = () => {
		if (reviews.length === 0) return 0;
		return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={theme.colors.primary} />
			</View>
		);
	}

	if (!field) {
		return (
			<View style={styles.loadingContainer}>
				<Text>Không tìm thấy sân</Text>
			</View>
		);
	}

	const renderPriceTable = () => (
		<View style={styles.priceTableContainer}>
			<View style={styles.sectionHeader}>
				<Ionicons name='pricetag' size={20} color={theme.colors.primary} />
				<Text style={styles.sectionTitle}>Bảng giá</Text>
			</View>

			{/* Table Header */}
			<View style={styles.tableHeader}>
				<View style={[styles.tableCell, styles.tableCellFirst]}>
					<Ionicons name='time-outline' size={16} color={theme.colors.primary} />
				</View>
				<Text style={[styles.tableHeaderText, styles.tableCell]}>T2-T5</Text>
				<Text style={[styles.tableHeaderText, styles.tableCell]}>T6</Text>
				<Text style={[styles.tableHeaderText, styles.tableCell]}>T7</Text>
				<Text style={[styles.tableHeaderText, styles.tableCell]}>CN</Text>
			</View>

			{/* Table Rows */}
			{PRICE_TABLE.map((row, index) => (
				<View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
					<Text style={[styles.tableTime, styles.tableCellFirst]}>{row.time}</Text>
					<Text style={styles.tableCellPrice}>{row.weekday / 1000}k</Text>
					<Text style={styles.tableCellPrice}>{row.friday / 1000}k</Text>
					<Text style={styles.tableCellPrice}>{row.saturday / 1000}k</Text>
					<Text style={styles.tableCellPrice}>{row.sunday / 1000}k</Text>
				</View>
			))}
		</View>
	);

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
				{(field.images && field.images.length > 0
					? field.images
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

	const renderReviews = () => (
		<View style={styles.reviewsContainer}>
			{/* Summary */}
			<View style={styles.reviewSummary}>
				<View style={styles.ratingBig}>
					<Text style={styles.ratingBigNumber}>{getAverageRating()}</Text>
					<Ionicons name='star' size={24} color='#f59e0b' />
				</View>
				<Text style={styles.reviewCount}>{reviews.length} đánh giá</Text>
			</View>

			{/* List */}
			{reviews.map((review) => (
				<View key={review.id} style={styles.reviewCard}>
					<View style={styles.reviewHeader}>
						<View style={styles.reviewerInfo}>
							<View style={styles.avatar}>
								<Ionicons name='person' size={20} color={theme.colors.white} />
							</View>
							<View>
								<Text style={styles.reviewerName}>Người dùng #{review.playerId}</Text>
								<Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
							</View>
						</View>
						<View style={styles.reviewRating}>
							{[...Array(5)].map((_, i) => (
								<Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={14} color='#f59e0b' />
							))}
						</View>
					</View>
					{review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
				</View>
			))}
		</View>
	);

	const renderTerms = () => (
		<View style={styles.termsContainer}>
			{/* Booking Terms */}
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

			{/* Usage Terms */}
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
				return renderReviews();
			case 'terms':
				return renderTerms();
			default:
				return null;
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Main Image */}
				<Image
					source={{ uri: field.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800' }}
					style={styles.mainImage}
					resizeMode='cover'
				/>

				{/* Content */}
				<View style={styles.content}>
					{/* Title */}
					<View style={styles.titleRow}>
						<View style={styles.titleInfo}>
							<Text style={styles.fieldName}>{field.name}</Text>
							<View style={styles.typeTag}>
								<Text style={styles.typeText}>{FIELD_TYPE_LABELS[field.fieldType]}</Text>
							</View>
						</View>
						<TouchableOpacity style={styles.favoriteBtn} onPress={() => setIsFavorite(!isFavorite)}>
							<Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={theme.colors.accent} />
						</TouchableOpacity>
					</View>

					{/* Rating */}
					<View style={styles.ratingRow}>
						<Ionicons name='star' size={16} color='#f59e0b' />
						<Text style={styles.ratingText}>{getAverageRating()}</Text>
						<Text style={styles.reviewCountSmall}>({reviews.length} đánh giá)</Text>
					</View>

					{/* Location */}
					<View style={styles.infoCard}>
						<View style={styles.infoHeader}>
							<Ionicons name='location' size={20} color={theme.colors.primary} />
							<Text style={styles.infoTitle}>Địa chỉ</Text>
						</View>
						<Text style={styles.infoValue}>{field.venue?.address}</Text>
					</View>

					{/* Contact */}
					<View style={styles.infoCard}>
						<View style={styles.contactRow}>
							<View style={styles.contactItem}>
								<Ionicons name='call-outline' size={18} color={theme.colors.primary} />
								<Text style={styles.contactText}>0123 456 789</Text>
							</View>
							<View style={styles.contactItem}>
								<Ionicons name='time-outline' size={18} color={theme.colors.primary} />
								<Text style={styles.contactText}>
									{field.venue?.openTime} - {field.venue?.closeTime}
								</Text>
							</View>
						</View>
					</View>

					{/* Price Table */}
					{renderPriceTable()}

					{/* Facilities */}
					<View style={styles.infoCard}>
						<View style={styles.infoHeader}>
							<Ionicons name='grid' size={20} color={theme.colors.primary} />
							<Text style={styles.infoTitle}>Tiện ích</Text>
						</View>
						<View style={styles.facilitiesRow}>
							{field.venue?.facilities.map((facility, index) => (
								<View key={index} style={styles.facilityTag}>
									<Text style={styles.facilityText}>{facility}</Text>
								</View>
							))}
						</View>
					</View>

					{/* Description */}
					<View style={styles.infoCard}>
						<View style={styles.infoHeader}>
							<Ionicons name='information-circle' size={20} color={theme.colors.primary} />
							<Text style={styles.infoTitle}>Mô tả</Text>
						</View>
						<Text style={styles.description}>{field.description}</Text>
					</View>

					{/* Tabs Section */}
					{renderTabs()}
					{renderTabContent()}
				</View>
			</ScrollView>

			{/* Bottom Bar */}
			<View style={styles.bottomBar}>
				<View style={styles.priceInfo}>
					<Text style={styles.priceLabel}>Giá từ</Text>
					<Text style={styles.price}>
						{formatPrice(field.pricePerHour)}đ<Text style={styles.priceUnit}>/giờ</Text>
					</Text>
				</View>
				<TouchableOpacity style={styles.bookButton} onPress={() => setShowBookingModal(true)}>
					<Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
				</TouchableOpacity>
			</View>

			{/* Booking Modal */}
			<BookingModal
				visible={showBookingModal}
				onClose={() => setShowBookingModal(false)}
				field={field}
				onBookingSuccess={() => {
					setShowBookingModal(false);
					// Could navigate to bookings screen or show notification
				}}
			/>
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
		backgroundColor: theme.colors.background,
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
	fieldName: {
		fontSize: 22,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.sm,
	},
	typeTag: {
		backgroundColor: theme.colors.secondary,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.full,
		alignSelf: 'flex-start',
	},
	typeText: {
		color: theme.colors.white,
		fontSize: 12,
		fontWeight: '600',
	},
	favoriteBtn: {
		padding: theme.spacing.sm,
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
	reviewCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.sm,
	},
	reviewHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
	},
	reviewerInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
	reviewerName: {
		fontSize: 14,
		fontWeight: '500',
		color: theme.colors.foreground,
	},
	reviewDate: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
	},
	reviewRating: {
		flexDirection: 'row',
		gap: 2,
	},
	reviewComment: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		lineHeight: 20,
	},
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
		fontWeight: 'normal',
		color: theme.colors.foregroundMuted,
	},
	bookButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.xxl,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
	},
	bookButtonText: {
		color: theme.colors.white,
		fontWeight: '600',
		fontSize: 16,
	},
});

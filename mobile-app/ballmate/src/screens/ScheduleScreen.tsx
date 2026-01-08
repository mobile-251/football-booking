import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Image,
	Modal,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Booking, BookingStatus, PAYMENT_METHOD_LABELS, PaymentMethod } from '../types/types';
import { api } from '../services/api';
import { formatPrice } from '../utils/formatters';

type TabType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BookingWithDetails extends Booking {
	fieldName?: string;
	fieldImage?: string;
	venueName?: string;
	venueAddress?: string;
	displayName?: string; // <Venue name> (Sân <Field name>)
	dates?: string[];
	timeSlots?: string[];
}

const TABS: { key: TabType; label: string }[] = [
	{ key: 'all', label: 'Tất cả' },
	{ key: 'pending', label: 'Chờ xác nhận' },
	{ key: 'confirmed', label: 'Đã xác nhận' },
	{ key: 'completed', label: 'Đã hoàn thành' },
	{ key: 'cancelled', label: 'Đã hủy' },
];

const getStatusColor = (status: BookingStatus) => {
	switch (status) {
		case 'CONFIRMED':
			return '#22c55e';
		case 'PENDING':
			return '#f59e0b';
		case 'CANCELLED':
			return theme.colors.accent;
		case 'COMPLETED':
			return theme.colors.primary;
		default:
			return theme.colors.foregroundMuted;
	}
};

const getStatusLabel = (status: BookingStatus) => {
	switch (status) {
		case 'CONFIRMED':
			return 'Đã xác nhận';
		case 'PENDING':
			return 'Chờ xác nhận';
		case 'CANCELLED':
			return 'Đã hủy';
		case 'COMPLETED':
			return 'Đã hoàn thành';
		default:
			return status;
	}
};

const getStatusBgColor = (status: BookingStatus) => {
	switch (status) {
		case 'CONFIRMED':
			return '#dcfce7';
		case 'PENDING':
			return '#fef3c7';
		case 'CANCELLED':
			return '#fee2e2';
		case 'COMPLETED':
			return '#e0f2fe';
		default:
			return theme.colors.background;
	}
};

export default function ScheduleScreen() {
	const [activeTab, setActiveTab] = useState<TabType>('all');
	const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
	const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);

	useEffect(() => {
		loadBookings();
	}, []);

	useEffect(() => {
		filterBookings();
	}, [bookings, activeTab]);

	const loadBookings = async () => {
		try {
			setLoading(true);
			// Get player ID from current logged-in user
			const playerId = api.currentUser?.player?.id;
			if (!playerId) {
				console.warn('No player ID found, user may not be logged in');
				setBookings([]);
				setLoading(false);
				return;
			}
			const data = await api.getBookings({ playerId });

			// Enrich with field/venue info
			const enrichedBookings = data.map((booking) => ({
				...booking,
				fieldName: booking.field?.name || 'Sân Bóng mini Bắc Rạch Chiếc',
				fieldImage: booking.field?.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400',
				venueName: booking.field?.venue?.name || '',
				venueAddress: booking.field?.venue?.address || 'Đường 410, Phước Long A, Quận 9, TP.HCM',
				displayName: booking.field?.venue?.name && booking.field?.name
					? `${booking.field.venue.name} (Sân ${booking.field.name})`
					: booking.field?.name || 'Sân chưa xác định',
				dates: [formatDateShort(booking.startTime)],
				timeSlots: [formatTimeRange(booking.startTime, booking.endTime)],
			}));

			setBookings(enrichedBookings);
		} catch (error) {
			console.error('Failed to load bookings:', error);
			// No mock data - show empty state
			setBookings([]);
		} finally {
			setLoading(false);
		}
	};

	const filterBookings = () => {
		let result = [...bookings];

		switch (activeTab) {
			case 'pending':
				result = result.filter((b) => b.status === 'PENDING');
				break;
			case 'confirmed':
				result = result.filter((b) => b.status === 'CONFIRMED');
				break;
			case 'completed':
				result = result.filter((b) => b.status === 'COMPLETED');
				break;
			case 'cancelled':
				result = result.filter((b) => b.status === 'CANCELLED');
				break;
		}

		setFilteredBookings(result);
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadBookings();
		setRefreshing(false);
	};

	const formatDateShort = (dateStr: string) => {
		const date = new Date(dateStr);
		const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
		return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
	};

	const formatTimeRange = (start: string, end: string) => {
		const startDate = new Date(start);
		const endDate = new Date(end);
		const formatTime = (d: Date) =>
			`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
		return `${formatTime(startDate)} - ${formatTime(endDate)}`;
	};

	const getTabCount = (tab: TabType) => {
		switch (tab) {
			case 'all':
				return bookings.length;
			case 'pending':
				return bookings.filter((b) => b.status === 'PENDING').length;
			case 'confirmed':
				return bookings.filter((b) => b.status === 'CONFIRMED').length;
			case 'completed':
				return bookings.filter((b) => b.status === 'COMPLETED').length;
			case 'cancelled':
				return bookings.filter((b) => b.status === 'CANCELLED').length;
			default:
				return 0;
		}
	};

	const handleCancelBooking = async (bookingId: number) => {
		try {
			await api.cancelBooking(bookingId);
			loadBookings();
			setShowDetailModal(false);
		} catch (error) {
			console.error('Failed to cancel booking:', error);
			// Update locally for demo
			setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as BookingStatus } : b)));
			setShowDetailModal(false);
		}
	};

	const openDetailModal = (booking: BookingWithDetails) => {
		setSelectedBooking(booking);
		setShowDetailModal(true);
	};

	const renderBookingCard = ({ item }: { item: BookingWithDetails }) => (
		<TouchableOpacity style={styles.bookingCard} onPress={() => openDetailModal(item)}>
			{/* Image & Field Type Tags */}
			<View style={styles.cardImageContainer}>
				<Image source={{ uri: item.fieldImage }} style={styles.cardImage} resizeMode='cover' />
				<View style={styles.fieldTypeTags}>
					<View style={styles.fieldTypeTag}>
						<Text style={styles.fieldTypeTagText}>Sân 5</Text>
					</View>
					<View style={styles.fieldTypeTag}>
						<Text style={styles.fieldTypeTagText}>Sân 7</Text>
					</View>
				</View>
				{/* Status Badge */}
				<View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
					<Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
				</View>
				{/* Booking ID */}
				<View style={styles.bookingIdBadge}>
					<Text style={styles.bookingIdText}>{item.bookingCode}</Text>
				</View>
			</View>

			{/* Content */}
			<View style={styles.cardContent}>
				<Text style={styles.fieldName}>{item.displayName}</Text>

				<View style={styles.infoRow}>
					<Ionicons name='location-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText} numberOfLines={1}>
						{item.venueAddress}
					</Text>
				</View>

				{/* Dates */}
				<View style={styles.infoRow}>
					<Ionicons name='calendar-outline' size={14} color={theme.colors.foregroundMuted} />
					<View style={styles.tagsRow}>
						{item.dates?.map((date, idx) => (
							<View key={idx} style={styles.dateTag}>
								<Text style={styles.dateTagText}>{date}</Text>
							</View>
						))}
					</View>
				</View>

				{/* Time Slots */}
				<View style={styles.infoRow}>
					<Ionicons name='time-outline' size={14} color={theme.colors.foregroundMuted} />
					<View style={styles.tagsRow}>
						{item.timeSlots?.map((slot, idx) => (
							<View key={idx} style={styles.timeTag}>
								<Text style={styles.timeTagText}>{slot}</Text>
							</View>
						))}
					</View>
				</View>

				{/* Payment */}
				<View style={styles.infoRow}>
					<Ionicons name='wallet-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText}>
						{item.payment?.method
							? PAYMENT_METHOD_LABELS[item.payment.method as PaymentMethod] || item.payment.method
							: 'Chưa thanh toán'}
					</Text>
				</View>

				{/* Price & Actions */}
				<View style={styles.cardFooter}>
					<View>
						<Text style={styles.priceLabel}>Tổng tiền</Text>
						<Text style={styles.price}>{formatPrice(item.totalPrice)}đ</Text>
					</View>
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.detailBtn} onPress={() => openDetailModal(item)}>
							<Ionicons name='eye-outline' size={14} color={theme.colors.primary} />
							<Text style={styles.detailBtnText}>Chi tiết</Text>
						</TouchableOpacity>
						{item.status === 'PENDING' && (
							<TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelBooking(item.id)}>
								<Ionicons name='close' size={14} color={theme.colors.accent} />
								<Text style={styles.cancelBtnText}>Hủy</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);

	const renderDetailModal = () => {
		if (!selectedBooking) return null;

		return (
			<Modal
				visible={showDetailModal}
				animationType='slide'
				transparent
				onRequestClose={() => setShowDetailModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						{/* Header */}
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Chi tiết đặt sân</Text>
							<TouchableOpacity onPress={() => setShowDetailModal(false)}>
								<Ionicons name='close' size={24} color={theme.colors.foreground} />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalContent}>
							{/* Booking ID */}
							<View style={styles.detailRow}>
								<View style={styles.detailIconContainer}>
									<Ionicons name='receipt-outline' size={20} color={theme.colors.primary} />
								</View>
								<View style={styles.detailInfo}>
									<Text style={styles.detailLabel}>Mã đặt sân</Text>
									<Text style={styles.detailValue}>{selectedBooking.bookingCode}</Text>
								</View>
							</View>

							{/* Field */}
							<View style={styles.detailRow}>
								<View style={styles.detailIconContainer}>
									<Ionicons name='football-outline' size={20} color={theme.colors.primary} />
								</View>
								<View style={styles.detailInfo}>
									<Text style={styles.detailLabel}>Sân bóng</Text>
									<Text style={styles.detailValue}>{selectedBooking.displayName}</Text>
									<Text style={styles.detailSubvalue}>{selectedBooking.venueAddress}</Text>
								</View>
							</View>

							{/* Date */}
							<View style={styles.detailRow}>
								<View style={styles.detailIconContainer}>
									<Ionicons name='calendar-outline' size={20} color={theme.colors.primary} />
								</View>
								<View style={styles.detailInfo}>
									<Text style={styles.detailLabel}>Ngày đặt sân</Text>
									<View style={styles.detailWithAction}>
										<Text style={styles.detailValue}>{selectedBooking.dates?.[0]}</Text>
										<View style={styles.chatIcon}>
											<Ionicons name='chatbubble-outline' size={16} color={theme.colors.primary} />
										</View>
									</View>
								</View>
							</View>

							{/* Time */}
							<View style={styles.detailRow}>
								<View style={styles.detailIconContainer}>
									<Ionicons name='time-outline' size={20} color={theme.colors.primary} />
								</View>
								<View style={styles.detailInfo}>
									<Text style={styles.detailLabel}>Khung giờ</Text>
									<Text style={styles.detailValue}>{selectedBooking.timeSlots?.[0]}</Text>
								</View>
							</View>

							{/* Payment Method */}
							<View style={styles.detailRow}>
								<View style={styles.detailIconContainer}>
									<Ionicons name='wallet-outline' size={20} color={theme.colors.primary} />
								</View>
								<View style={styles.detailInfo}>
									<Text style={styles.detailLabel}>Phương thức thanh toán</Text>
									<Text style={styles.detailValue}>
										{selectedBooking.payment?.method
											? PAYMENT_METHOD_LABELS[selectedBooking.payment.method as PaymentMethod] ||
											selectedBooking.payment.method
											: 'Chưa thanh toán'}
									</Text>
								</View>
							</View>

							{/* Total */}
							<View style={styles.totalBox}>
								<Text style={styles.totalLabel}>Tổng tiền thanh toán</Text>
								<Text style={styles.totalValue}>{formatPrice(selectedBooking.totalPrice)}đ</Text>
							</View>
						</ScrollView>

						{/* Actions */}
						<View style={styles.modalFooter}>
							<TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDetailModal(false)}>
								<Text style={styles.modalCloseBtnText}>Đóng</Text>
							</TouchableOpacity>
							{selectedBooking.status === 'PENDING' && (
								<TouchableOpacity style={styles.modalCancelBtn} onPress={() => handleCancelBooking(selectedBooking.id)}>
									<Text style={styles.modalCancelBtnText}>Hủy đặt sân</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</Modal>
		);
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<SafeAreaView style={styles.header} edges={['top']}>
				<Text style={styles.title}>Lịch đặt sân</Text>
				<Text style={styles.subtitle}>Quản lý các lượt đặt của bạn</Text>
			</SafeAreaView>

			{/* Tabs */}
			<View style={styles.tabsContainer}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					{TABS.map((tab) => (
						<TouchableOpacity
							key={tab.key}
							style={[styles.tab, activeTab === tab.key && styles.tabActive]}
							onPress={() => setActiveTab(tab.key)}
						>
							<Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
							<View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
								<Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
									{getTabCount(tab.key)}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Booking List */}
			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size='large' color={theme.colors.primary} />
				</View>
			) : (
				<FlatList
					data={filteredBookings}
					renderItem={renderBookingCard}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
					}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Ionicons name='calendar-outline' size={64} color={theme.colors.secondary} />
							<Text style={styles.emptyTitle}>Chưa có lịch đặt</Text>
							<Text style={styles.emptyText}>Bạn chưa có lịch đặt sân nào.{'\n'}Hãy tìm và đặt sân ngay!</Text>
						</View>
					}
				/>
			)}

			{/* Detail Modal */}
			{renderDetailModal()}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.md,
		paddingBottom: theme.spacing.xl,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: theme.colors.white,
	},
	subtitle: {
		fontSize: 14,
		color: theme.colors.white,
		opacity: 0.8,
		marginTop: 4,
	},
	tabsContainer: {
		backgroundColor: theme.colors.white,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.lg,
		marginTop: -theme.spacing.md,
		marginHorizontal: theme.spacing.lg,
		borderRadius: theme.borderRadius.md,
		...theme.shadows.soft,
	},
	tab: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		marginRight: theme.spacing.sm,
		borderRadius: theme.borderRadius.full,
		backgroundColor: theme.colors.background,
	},
	tabActive: {
		backgroundColor: theme.colors.primary,
	},
	tabText: {
		fontSize: 13,
		color: theme.colors.foreground,
		marginRight: 6,
	},
	tabTextActive: {
		color: theme.colors.white,
		fontWeight: '600',
	},
	tabBadge: {
		backgroundColor: theme.colors.white,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
	},
	tabBadgeActive: {
		backgroundColor: 'rgba(255,255,255,0.3)',
	},
	tabBadgeText: {
		fontSize: 11,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	tabBadgeTextActive: {
		color: theme.colors.white,
	},
	listContent: {
		padding: theme.spacing.lg,
		paddingBottom: 100,
	},
	bookingCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		marginBottom: theme.spacing.lg,
		overflow: 'hidden',
		...theme.shadows.soft,
	},
	cardImageContainer: {
		position: 'relative',
		height: 100,
	},
	cardImage: {
		width: '100%',
		height: '100%',
	},
	fieldTypeTags: {
		position: 'absolute',
		top: 10,
		left: 10,
		flexDirection: 'row',
		gap: 6,
	},
	fieldTypeTag: {
		backgroundColor: theme.colors.white,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.sm,
	},
	fieldTypeTagText: {
		fontSize: 11,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	statusBadge: {
		position: 'absolute',
		top: 10,
		right: 10,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.sm,
	},
	statusText: {
		fontSize: 11,
		fontWeight: '600',
	},
	bookingIdBadge: {
		position: 'absolute',
		bottom: 10,
		left: 10,
		backgroundColor: 'rgba(0,0,0,0.6)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.sm,
	},
	bookingIdText: {
		fontSize: 11,
		fontWeight: '600',
		color: theme.colors.white,
	},
	cardContent: {
		padding: theme.spacing.md,
	},
	fieldName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.sm,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		marginBottom: 8,
	},
	infoText: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	tagsRow: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
	},
	dateTag: {
		backgroundColor: theme.colors.primary + '15',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.sm,
	},
	dateTagText: {
		fontSize: 11,
		color: theme.colors.primary,
		fontWeight: '500',
	},
	timeTag: {
		backgroundColor: theme.colors.background,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: theme.borderRadius.sm,
	},
	timeTagText: {
		fontSize: 11,
		color: theme.colors.foreground,
	},
	cardFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.sm,
		paddingTop: theme.spacing.sm,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	priceLabel: {
		fontSize: 11,
		color: theme.colors.foregroundMuted,
	},
	price: {
		fontSize: 18,
		fontWeight: 'bold',
		color: theme.colors.primary,
	},
	actionButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	detailBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		borderColor: theme.colors.primary,
	},
	detailBtnText: {
		fontSize: 12,
		color: theme.colors.primary,
		fontWeight: '500',
	},
	cancelBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		borderColor: theme.colors.accent,
	},
	cancelBtnText: {
		fontSize: 12,
		color: theme.colors.accent,
		fontWeight: '500',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		textAlign: 'center',
		lineHeight: 22,
	},
	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.lg,
	},
	modalContainer: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		width: '100%',
		maxHeight: '80%',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	modalContent: {
		padding: theme.spacing.lg,
	},
	detailRow: {
		flexDirection: 'row',
		marginBottom: theme.spacing.lg,
	},
	detailIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: theme.colors.primary + '15',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: theme.spacing.md,
	},
	detailInfo: {
		flex: 1,
	},
	detailLabel: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		marginBottom: 4,
	},
	detailValue: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.foreground,
	},
	detailSubvalue: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginTop: 2,
	},
	detailWithAction: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	chatIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: theme.colors.primary + '15',
		justifyContent: 'center',
		alignItems: 'center',
	},
	totalBox: {
		backgroundColor: theme.colors.primary,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.lg,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: theme.spacing.md,
	},
	totalLabel: {
		fontSize: 14,
		color: theme.colors.white,
	},
	totalValue: {
		fontSize: 22,
		fontWeight: 'bold',
		color: theme.colors.white,
	},
	modalFooter: {
		flexDirection: 'row',
		gap: 12,
		padding: theme.spacing.lg,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	modalCloseBtn: {
		flex: 1,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.primary,
		alignItems: 'center',
	},
	modalCloseBtnText: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.white,
	},
	modalCancelBtn: {
		flex: 1,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		backgroundColor: theme.colors.accent,
		alignItems: 'center',
	},
	modalCancelBtnText: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.white,
	},
});

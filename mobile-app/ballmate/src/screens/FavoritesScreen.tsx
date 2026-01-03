import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatPrice } from '../utils/formatters';

interface FavoriteField {
	id: number;
	name: string;
	address: string;
	openTime: string;
	closeTime: string;
	pricePerHour: number;
	distance: number;
	image: string;
	available: boolean;
	nearBy: boolean;
	isFavorite: boolean;
}

const MOCK_FAVORITES: FavoriteField[] = [
	{
		id: 1,
		name: 'Sân bóng mini Bắc Rạch Chiếc',
		address: 'Đường 410, Phước Long A, Quận 9, TP.HCM',
		openTime: '00:00',
		closeTime: '24:00',
		pricePerHour: 200000,
		distance: 6.7,
		image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400',
		available: true,
		nearBy: true,
		isFavorite: true,
	},
	{
		id: 2,
		name: 'Sân bóng Thủ Đức FC',
		address: '123 Võ Văn Ngân, Thủ Đức, TP.HCM',
		openTime: '06:00',
		closeTime: '22:00',
		pricePerHour: 300000,
		distance: 3.2,
		image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
		available: true,
		nearBy: false,
		isFavorite: true,
	},
	{
		id: 3,
		name: 'Sân bóng Quận 7',
		address: '456 Nguyễn Thị Thập, Quận 7, TP.HCM',
		openTime: '05:00',
		closeTime: '23:00',
		pricePerHour: 250000,
		distance: 8.5,
		image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400',
		available: false,
		nearBy: false,
		isFavorite: true,
	},
];

export default function FavoritesScreen() {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();

	const handleBookNow = (field: FavoriteField) => {
		navigation.navigate('FieldDetail', { fieldId: field.id });
	};

	const renderField = ({ item }: { item: FavoriteField }) => (
		<View style={styles.fieldCard}>
			<View style={styles.imageContainer}>
				<Image source={{ uri: item.image }} style={styles.fieldImage} resizeMode='cover' />
				<View style={styles.badges}>
					{item.available && (
						<View style={styles.badgeAvailable}>
							<Ionicons name='flash' size={12} color={theme.colors.white} />
							<Text style={styles.badgeText}>Còn trống</Text>
						</View>
					)}
					{item.nearBy && (
						<View style={styles.badgeNearby}>
							<Ionicons name='location' size={12} color={theme.colors.white} />
							<Text style={styles.badgeText}>Gần tôi</Text>
						</View>
					)}
				</View>
				<TouchableOpacity style={styles.heartBtn}>
					<Ionicons
						name={item.isFavorite ? 'heart' : 'heart-outline'}
						size={22}
						color={item.isFavorite ? '#ef4444' : theme.colors.white}
					/>
				</TouchableOpacity>
			</View>

			<View style={styles.fieldContent}>
				<Text style={styles.fieldName}>{item.name}</Text>

				<View style={styles.infoRow}>
					<Ionicons name='location-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText} numberOfLines={1}>
						{item.address}
					</Text>
				</View>

				<View style={styles.infoRow}>
					<Ionicons name='time-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText}>
						{item.openTime} - {item.closeTime}
					</Text>
				</View>

				<View style={styles.priceRow}>
					<Text style={styles.price}>Chỉ từ {formatPrice(item.pricePerHour)}đ/giờ</Text>
					<Text style={styles.distance}>{item.distance}km</Text>
				</View>

				<TouchableOpacity style={styles.bookBtn} onPress={() => handleBookNow(item)}>
					<Text style={styles.bookBtnText}>Đặt lịch ngay</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			<View style={styles.header}>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
						<Ionicons name='chevron-back' size={24} color={theme.colors.white} />
					</TouchableOpacity>
					<Text style={styles.title}>Sân yêu thích</Text>
					<View style={{ width: 40 }} />
				</View>

				<View style={styles.statsCard}>
					<View style={styles.statsLeft}>
						<Text style={styles.statsLabel}>Tổng số sân yêu thích</Text>
						<Text style={styles.statsValue}>{MOCK_FAVORITES.length}</Text>
						<Text style={styles.statsSub}>Đã lưu trong danh sách</Text>
					</View>
					<View style={styles.heartContainer}>
						<Ionicons name='heart' size={40} color={theme.colors.white} />
					</View>
				</View>
			</View>

			<FlatList
				data={MOCK_FAVORITES}
				renderItem={renderField}
				keyExtractor={(item) => item.id.toString()}
				style={styles.list}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Ionicons name='heart-outline' size={64} color={theme.colors.secondary} />
						<Text style={styles.emptyTitle}>Chưa có sân yêu thích</Text>
						<Text style={styles.emptyText}>Hãy thêm sân yêu thích để dễ dàng đặt lịch.</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		backgroundColor: '#f87171',
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		paddingBottom: theme.spacing.xl,
	},
	headerTop: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: theme.spacing.lg,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.white,
	},
	statsCard: {
		backgroundColor: 'rgba(255,255,255,0.2)',
		borderRadius: theme.borderRadius.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: theme.spacing.lg,
	},
	statsLeft: {},
	statsLabel: {
		fontSize: 12,
		color: theme.colors.white,
		opacity: 0.9,
		marginBottom: 4,
	},
	statsValue: {
		fontSize: 36,
		fontWeight: 'bold',
		color: theme.colors.white,
	},
	statsSub: {
		fontSize: 12,
		color: theme.colors.white,
		opacity: 0.8,
	},
	heartContainer: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: 'rgba(255,255,255,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	list: {
		flex: 1,
	},
	listContent: {
		padding: theme.spacing.lg,
	},
	fieldCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		overflow: 'hidden',
		marginBottom: theme.spacing.lg,
		...theme.shadows.soft,
	},
	imageContainer: {
		position: 'relative',
	},
	fieldImage: {
		width: '100%',
		height: 180,
		backgroundColor: theme.colors.background,
	},
	badges: {
		position: 'absolute',
		top: 12,
		left: 12,
		flexDirection: 'row',
		gap: 8,
	},
	badgeAvailable: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: theme.borderRadius.full,
		gap: 4,
	},
	badgeNearby: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f59e0b',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: theme.borderRadius.full,
		gap: 4,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: '600',
		color: theme.colors.white,
	},
	heartBtn: {
		position: 'absolute',
		top: 12,
		right: 12,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(255,255,255,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fieldContent: {
		padding: theme.spacing.lg,
	},
	fieldName: {
		fontSize: 17,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: theme.spacing.sm,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 6,
	},
	infoText: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.foregroundMuted,
	},
	priceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.md,
	},
	price: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.foreground,
	},
	distance: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.primary,
	},
	bookBtn: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 14,
		borderRadius: theme.borderRadius.lg,
		alignItems: 'center',
	},
	bookBtnText: {
		fontSize: 15,
		fontWeight: '600',
		color: theme.colors.white,
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
	},
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatPrice } from '../utils/formatters';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FavoriteField {
	id: number;
	name: string;
	address: string;
	openTime: string;
	closeTime: string;
	pricePerHour: number;
	image: string;
	available: boolean;
}

export default function FavoritesScreen() {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [favorites, setFavorites] = useState<FavoriteField[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!authLoading) {
			if (isAuthenticated) {
				loadFavorites();
			} else {
				setLoading(false);
			}
		}
	}, [isAuthenticated, authLoading]);

	const loadFavorites = async () => {
		try {
			setLoading(true);
			const data = await api.getFavorites();
			const mappedFavorites = data.map((fav: any) => ({
				id: fav.fieldId,
				name: fav.field?.name || 'Không có tên',
				address: fav.field?.venue?.address || 'Không có địa chỉ',
				openTime: fav.field?.venue?.openTime || '--:--',
				closeTime: fav.field?.venue?.closeTime || '--:--',
				pricePerHour: fav.field?.pricePerHour || 0,
				image: fav.field?.images?.[0] || '',
				available: fav.field?.isActive ?? false,
			}));
			setFavorites(mappedFavorites);
		} catch (error: any) {
			console.error('Failed to load favorites:', error);
			setFavorites([]);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveFavorite = async (fieldId: number) => {
		try {
			await api.removeFavorite(fieldId);
			setFavorites(favorites.filter(f => f.id !== fieldId));
		} catch (error) {
			console.error('Failed to remove favorite:', error);
		}
	};

	const handleBookNow = (field: FavoriteField) => {
		navigation.navigate('FieldDetail', { fieldId: field.id });
	};

	const handleLogin = () => {
		navigation.navigate('Login');
	};

	const renderField = ({ item }: { item: FavoriteField }) => (
		<View style={styles.fieldCard}>
			<View style={styles.imageContainer}>
				{item.image ? (
					<Image source={{ uri: item.image }} style={styles.fieldImage} resizeMode='cover' />
				) : (
					<View style={[styles.fieldImage, styles.placeholderImage]}>
						<Ionicons name='football-outline' size={40} color={theme.colors.foregroundMuted} />
					</View>
				)}
				<View style={styles.badges}>
					{item.available && (
						<View style={styles.badgeAvailable}>
							<Ionicons name='flash' size={12} color={theme.colors.white} />
							<Text style={styles.badgeText}>Còn trống</Text>
						</View>
					)}
				</View>
				<TouchableOpacity style={styles.heartBtn} onPress={() => handleRemoveFavorite(item.id)}>
					<Ionicons name='heart' size={22} color='#ef4444' />
				</TouchableOpacity>
			</View>

			<View style={styles.fieldContent}>
				<Text style={styles.fieldName}>{item.name}</Text>

				<View style={styles.infoRow}>
					<Ionicons name='location-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText} numberOfLines={1}>
						{item.address || 'Chưa có địa chỉ'}
					</Text>
				</View>

				<View style={styles.infoRow}>
					<Ionicons name='time-outline' size={14} color={theme.colors.foregroundMuted} />
					<Text style={styles.infoText}>
						{item.openTime} - {item.closeTime}
					</Text>
				</View>

				<View style={styles.priceRow}>
					<Text style={styles.price}>
						{item.pricePerHour > 0 ? `Chỉ từ ${formatPrice(item.pricePerHour)}đ/giờ` : 'Liên hệ giá'}
					</Text>
				</View>

				<TouchableOpacity style={styles.bookBtn} onPress={() => handleBookNow(item)}>
					<Text style={styles.bookBtnText}>Đặt lịch ngay</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	const renderLoginPrompt = () => (
		<View style={styles.loginContainer}>
			<Ionicons name='lock-closed-outline' size={64} color={theme.colors.secondary} />
			<Text style={styles.loginTitle}>Chưa đăng nhập</Text>
			<Text style={styles.loginText}>
				Vui lòng đăng nhập để xem danh sách sân yêu thích của bạn
			</Text>
			<TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
				<Text style={styles.loginBtnText}>Đăng nhập</Text>
			</TouchableOpacity>
		</View>
	);

	if (loading || authLoading) {
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
				</View>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
				</View>
			</SafeAreaView>
		);
	}

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

				{isAuthenticated && (
					<View style={styles.statsCard}>
						<View style={styles.statsLeft}>
							<Text style={styles.statsLabel}>Tổng số sân yêu thích</Text>
							<Text style={styles.statsValue}>{favorites.length}</Text>
							<Text style={styles.statsSub}>Đã lưu trong danh sách</Text>
						</View>
						<View style={styles.heartContainer}>
							<Ionicons name='heart' size={40} color={theme.colors.white} />
						</View>
					</View>
				)}
			</View>

			{!isAuthenticated ? (
				renderLoginPrompt()
			) : (
				<FlatList
					data={favorites}
					renderItem={renderField}
					keyExtractor={(item) => item.id.toString()}
					style={styles.list}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Ionicons name='heart-outline' size={64} color={theme.colors.secondary} />
							<Text style={styles.emptyTitle}>Chưa có sân yêu thích</Text>
							<Text style={styles.emptyText}>
								Hãy thêm sân yêu thích từ trang chi tiết sân{'\n'}để dễ dàng đặt lịch sau này.
							</Text>
						</View>
					}
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
	placeholderImage: {
		justifyContent: 'center',
		alignItems: 'center',
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
		backgroundColor: 'rgba(255,255,255,0.9)',
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
	loginContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: theme.spacing.xl,
	},
	loginTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: theme.colors.foreground,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
	},
	loginText: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		textAlign: 'center',
		marginBottom: theme.spacing.xl,
	},
	loginBtn: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.xl,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.lg,
	},
	loginBtnText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.white,
	},
});

import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	Alert,
	RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { formatCoin } from '../utils/coin';
import {
	comboPerMatchCoin,
	extractNeedTopUp,
	fieldTypeLabel,
	type ComboPackageItem,
} from '../utils/combo';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import QuickTopUpSheet from '../components/QuickTopUpSheet';

export default function ComboMarketScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const route = useRoute<RouteProp<RootStackParamList, 'ComboMarket'>>();
	const { venueId, venueName } = route.params;
	const [packages, setPackages] = useState<ComboPackageItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [purchasingId, setPurchasingId] = useState<number | null>(null);
	const [jit, setJit] = useState<{ missingCoin: number; comboPackageId: number } | null>(null);

	const load = useCallback(async (silent = false) => {
		try {
			if (!silent) setLoading(true);
			const list = await api.getComboPackages(venueId);
			setPackages(list.filter((p) => p.isActive !== false));
		} catch (e) {
			console.error('[ComboMarket] load failed', e);
			setPackages([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [venueId]);

	useRefreshOnFocus(() => load(true), true);

	const onRefresh = () => {
		setRefreshing(true);
		load(true);
	};

	const purchase = async (pkg: ComboPackageItem) => {
		setPurchasingId(pkg.id);
		try {
			await api.purchaseCombo(pkg.id);
			Alert.alert('Thành công', `Đã mua "${pkg.name}". Xem trong Gói combo của tôi.`, [
				{ text: 'OK' },
				{
					text: 'Xem gói',
					onPress: () => navigation.navigate('MyCombos'),
				},
			]);
			load(true);
		} catch (err: unknown) {
			const topUp = extractNeedTopUp(err);
			if (topUp) {
				setJit({
					missingCoin: topUp.missingCoin,
					comboPackageId: topUp.comboPackageId ?? pkg.id,
				});
			} else {
				const msg =
					(err as { response?: { data?: { message?: string } } })?.response?.data
						?.message ?? 'Không thể mua gói. Kiểm tra số dư coin.';
				Alert.alert('Lỗi', String(msg));
			}
		} finally {
			setPurchasingId(null);
		}
	};

	const renderItem = ({ item }: { item: ComboPackageItem }) => {
		const perMatch = comboPerMatchCoin(item);
		const isBuying = purchasingId === item.id;

		return (
			<View style={styles.card}>
				<View style={styles.cardTop}>
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{fieldTypeLabel(item.fieldType)}</Text>
					</View>
					<Text style={styles.name}>{item.name}</Text>
					{item.description ? (
						<Text style={styles.desc}>{item.description}</Text>
					) : null}
				</View>

				<View style={styles.metaRow}>
					<View style={styles.metaItem}>
						<Ionicons name='football-outline' size={18} color={theme.colors.primary} />
						<Text style={styles.metaText}>{item.matchCount} lượt</Text>
					</View>
					<View style={styles.metaItem}>
						<Ionicons name='calendar-outline' size={18} color={theme.colors.primary} />
						<Text style={styles.metaText}>{item.validityDays} ngày</Text>
					</View>
				</View>

				<View style={styles.priceBlock}>
					<Text style={styles.price}>{formatCoin(item.priceCoin)}</Text>
					<Text style={styles.perMatch}>~{formatCoin(perMatch)}/lượt</Text>
				</View>

				<TouchableOpacity
					style={[styles.btn, isBuying && styles.btnDisabled]}
					onPress={() => purchase(item)}
					disabled={isBuying}
				>
					{isBuying ? (
						<ActivityIndicator color='#fff' />
					) : (
						<Text style={styles.btnText}>Mua ngay</Text>
					)}
				</TouchableOpacity>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} color={theme.colors.foreground} />
				</TouchableOpacity>
				<View style={styles.headerCenter}>
					<Text style={styles.headerTitle}>Gói combo</Text>
					{venueName ? (
						<Text style={styles.headerSub} numberOfLines={1}>
							{venueName}
						</Text>
					) : null}
				</View>
				<TouchableOpacity onPress={() => navigation.navigate('MyCombos')}>
					<Text style={styles.link}>Của tôi</Text>
				</TouchableOpacity>
			</View>

			{loading ? (
				<ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
			) : (
				<FlatList
					data={packages}
					keyExtractor={(item) => String(item.id)}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					renderItem={renderItem}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Ionicons name='ticket-outline' size={48} color={theme.colors.foregroundMuted} />
							<Text style={styles.emptyTitle}>Chưa có gói combo</Text>
							<Text style={styles.emptyDesc}>
								Cụm sân này chưa mở gói combo trên hệ thống. Chủ sân cấu hình tại web
								→ Gói combo.
							</Text>
						</View>
					}
				/>
			)}

			{jit && (
				<QuickTopUpSheet
					visible
					missingCoin={jit.missingCoin}
					comboPackageId={jit.comboPackageId}
					purpose='COMBO_JIT'
					onClose={() => setJit(null)}
					onSuccess={() => {
						setJit(null);
						Alert.alert(
							'Thành công',
							'Đã nạp coin và mua gói combo. Xem trong Gói combo của tôi.',
							[
								{ text: 'OK' },
								{
									text: 'Xem gói',
									onPress: () => navigation.navigate('MyCombos'),
								},
							],
						);
						load(true);
					}}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: theme.colors.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		paddingTop: 48,
		backgroundColor: theme.colors.white,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
	headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.foreground },
	headerSub: { fontSize: 12, color: theme.colors.foregroundMuted, marginTop: 2 },
	link: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
	listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
	card: {
		backgroundColor: theme.colors.white,
		padding: 16,
		borderRadius: 16,
		marginBottom: 14,
		borderWidth: 1,
		borderColor: 'rgba(31, 102, 80, 0.12)',
		...theme.shadows.soft,
	},
	cardTop: { marginBottom: 12 },
	badge: {
		alignSelf: 'flex-start',
		backgroundColor: '#ede9fe',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
		marginBottom: 8,
	},
	badgeText: { fontSize: 11, fontWeight: '700', color: '#7c3aed' },
	name: { fontSize: 17, fontWeight: '800', color: theme.colors.foreground },
	desc: { fontSize: 13, color: theme.colors.foregroundMuted, marginTop: 6, lineHeight: 18 },
	metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
	metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	metaText: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
	priceBlock: {
		backgroundColor: theme.colors.backgroundLight,
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
	},
	price: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
	perMatch: { fontSize: 13, color: theme.colors.foregroundMuted, marginTop: 2 },
	btn: {
		backgroundColor: theme.colors.primary,
		padding: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	btnDisabled: { opacity: 0.7 },
	btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
	empty: {
		alignItems: 'center',
		paddingVertical: 48,
		paddingHorizontal: 24,
	},
	emptyTitle: {
		fontSize: 17,
		fontWeight: '700',
		color: theme.colors.foreground,
		marginTop: 12,
	},
	emptyDesc: {
		textAlign: 'center',
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		marginTop: 8,
		lineHeight: 20,
	},
});

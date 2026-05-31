import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Image,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import {
	COIN_VND_RATE,
	coinBonusPercent,
	formatCoin,
	formatVnd,
	topUpTotalCoin,
	type TopUpPackageItem,
} from '../utils/coin';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

type TopUpOrder = {
	id: number;
	paymentCode: string;
	priceVnd: number;
	baseCoin?: number;
	bonusCoin?: number;
	expectedCoin?: number;
	sepayQrUrl?: string;
	expiresAt?: string;
	status?: string;
};

function formatCountdown(expiresAt?: string): string | null {
	if (!expiresAt) return null;
	const ms = new Date(expiresAt).getTime() - Date.now();
	if (ms <= 0) return 'Đã hết hạn';
	const m = Math.floor(ms / 60000);
	const s = Math.floor((ms % 60000) / 1000);
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TopUpScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [packages, setPackages] = useState<TopUpPackageItem[]>([]);
	const { balance, refreshWallet } = useWallet();
	const [order, setOrder] = useState<TopUpOrder | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [orderingId, setOrderingId] = useState<number | null>(null);
	const [countdown, setCountdown] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const checkOrderStatus = useCallback(
		async (orderId: number) => {
			const u = await api.getTopUpOrder(orderId);
			if (u.status === 'PAID') {
				if (pollRef.current) clearInterval(pollRef.current);
				setOrder(null);
				const freshBalance = await refreshWallet(true);
				const bal =
					freshBalance != null
						? `\nSố dư mới: ${formatCoin(freshBalance)}`
						: u.balance != null
							? `\nSố dư mới: ${formatCoin(u.balance)}`
							: '';
				Alert.alert('Nạp coin thành công', `Coin đã vào ví.${bal}`, [
					{ text: 'OK', onPress: () => navigation.goBack() },
				]);
			} else if (u.status === 'EXPIRED' || u.status === 'FAILED') {
				Alert.alert(
					'Đơn nạp không còn hiệu lực',
					'Vui lòng chọn gói và tạo đơn mới.',
				);
				setOrder(null);
			}
		},
		[navigation, refreshWallet],
	);

	const load = useCallback(async () => {
		try {
			setLoadError(null);
			setLoading(true);
			const [list] = await Promise.all([
				api.getTopUpPackages(),
				refreshWallet(true),
			]);
			const normalized: TopUpPackageItem[] = (list ?? []).map((p: any) => ({
				id: p.id,
				name: p.name,
				priceVnd: Number(p.priceVnd),
				baseCoin: Number(p.baseCoin),
				bonusCoin: Number(p.bonusCoin ?? 0),
				totalCoin: p.totalCoin != null ? Number(p.totalCoin) : undefined,
				sortOrder: p.sortOrder,
			}));
			setPackages(normalized);
			if (normalized.length === 0) {
				setLoadError('Chưa có gói nạp trên server. Khởi động lại backend hoặc chạy seed.');
			}
		} catch (e: any) {
			console.error(e);
			setLoadError(
				e?.response?.data?.message ?? 'Không tải được gói nạp. Kiểm tra kết nối API.',
			);
			setPackages([]);
		} finally {
			setLoading(false);
		}
	}, [refreshWallet]);

	useRefreshOnFocus(load, true);

	const bestDealId = useMemo(() => {
		let best: { id: number; pct: number } | null = null;
		for (const p of packages) {
			const pct = coinBonusPercent(p.baseCoin, p.bonusCoin);
			if (pct != null && (!best || pct > best.pct)) {
				best = { id: p.id, pct };
			}
		}
		return best?.id ?? null;
	}, [packages]);

	const selectPackage = async (pkg: TopUpPackageItem) => {
		setOrderingId(pkg.id);
		try {
			const o = await api.createTopUpOrder({ packageId: pkg.id });
			setOrder(o);
		} catch (e: any) {
			Alert.alert(
				'Không tạo được đơn nạp',
				e?.response?.data?.message ?? 'Vui lòng thử lại sau.',
			);
		} finally {
			setOrderingId(null);
		}
	};

	useEffect(() => {
		if (!order?.id) return;
		const poll = async () => {
			try {
				await checkOrderStatus(order.id);
			} catch {
				/* ignore poll errors */
			}
		};
		void poll();
		pollRef.current = setInterval(poll, 4000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [order?.id, checkOrderStatus]);

	useEffect(() => {
		if (!order?.expiresAt) {
			setCountdown(null);
			return;
		}
		const tick = () => setCountdown(formatCountdown(order.expiresAt));
		tick();
		tickRef.current = setInterval(tick, 1000);
		return () => {
			if (tickRef.current) clearInterval(tickRef.current);
		};
	}, [order?.expiresAt]);

	const renderRateBanner = () => (
		<View style={styles.rateCard}>
			<View style={styles.rateRow}>
				<View style={styles.rateIconWrap}>
					<Ionicons name='swap-horizontal' size={22} color={theme.colors.primary} />
				</View>
				<View style={styles.rateTextWrap}>
					<Text style={styles.rateTitle}>Tỉ giá nạp coin</Text>
					<Text style={styles.rateValue}>
						1 coin = {COIN_VND_RATE.toLocaleString('vi-VN')}₫
					</Text>
					<Text style={styles.rateHint}>
						Chuyển khoản SePay — coin vào ví ngay sau khi hệ thống xác nhận
					</Text>
				</View>
			</View>
			{balance != null && (
				<View style={styles.balancePill}>
					<Ionicons name='wallet-outline' size={16} color={theme.colors.primary} />
					<Text style={styles.balancePillText}>Số dư: {formatCoin(balance)}</Text>
				</View>
			)}
		</View>
	);

	const renderPackage = (item: TopUpPackageItem) => {
		const total = topUpTotalCoin(item);
		const bonusPct = coinBonusPercent(item.baseCoin, item.bonusCoin);
		const isBest = item.id === bestDealId && bonusPct != null;
		const isOrdering = orderingId === item.id;

		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.pkgCard, isBest && styles.pkgCardBest]}
				onPress={() => selectPackage(item)}
				disabled={!!orderingId}
				activeOpacity={0.88}
			>
				{isBest && (
					<View style={styles.hotBadge}>
						<Ionicons name='flame' size={12} color='#fff' />
						<Text style={styles.hotBadgeText}>Ưu đãi nhất</Text>
					</View>
				)}
				{bonusPct != null && !isBest && (
					<View style={styles.promoBadge}>
						<Text style={styles.promoBadgeText}>+{bonusPct}% KM</Text>
					</View>
				)}

				<View style={styles.pkgTop}>
					<Text style={styles.pkgName}>{item.name}</Text>
					<Text style={styles.pkgVnd}>{formatVnd(item.priceVnd)}</Text>
				</View>

				<View style={styles.pkgBreakdown}>
					<View style={styles.breakdownRow}>
						<Text style={styles.breakdownLabel}>Coin cơ bản</Text>
						<Text style={styles.breakdownValue}>{formatCoin(item.baseCoin)}</Text>
					</View>
					<Text style={styles.breakdownSub}>
						= {formatVnd(item.priceVnd)} ÷ {COIN_VND_RATE.toLocaleString('vi-VN')}
					</Text>
					{item.bonusCoin > 0 && (
						<View style={styles.breakdownRow}>
							<Text style={[styles.breakdownLabel, styles.bonusLabel]}>Thưởng KM</Text>
							<Text style={[styles.breakdownValue, styles.bonusValue]}>
								+{formatCoin(item.bonusCoin)}
							</Text>
						</View>
					)}
				</View>

				<View style={styles.pkgTotalRow}>
					<Text style={styles.pkgTotalLabel}>Bạn nhận</Text>
					<Text style={styles.pkgTotalValue}>{formatCoin(total)}</Text>
				</View>

				<View style={styles.pkgCta}>
					{isOrdering ? (
						<ActivityIndicator color={theme.colors.primary} />
					) : (
						<>
							<Text style={styles.pkgCtaText}>Nạp gói này</Text>
							<Ionicons name='chevron-forward' size={18} color={theme.colors.primary} />
						</>
					)}
				</View>
			</TouchableOpacity>
		);
	};

	if (order) {
		const expected = order.expectedCoin ?? 0;
		const base = order.baseCoin ?? 0;
		const bonus = order.bonusCoin ?? 0;

		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => setOrder(null)}>
						<Ionicons name='arrow-back' size={24} color={theme.colors.foreground} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Thanh toán SePay</Text>
					<View style={{ width: 24 }} />
				</View>

				<ScrollView contentContainerStyle={styles.payContent}>
					<View style={styles.paySummary}>
						<Text style={styles.payAmount}>{formatVnd(order.priceVnd)}</Text>
						<Text style={styles.payCoinLine}>
							Nhận <Text style={styles.payCoinBold}>{formatCoin(expected)}</Text>
							{bonus > 0 && (
								<Text style={styles.payCoinBonus}>
									{' '}
									({formatCoin(base)} + {formatCoin(bonus)} KM)
								</Text>
							)}
						</Text>
						{countdown && (
							<View style={styles.timerRow}>
								<Ionicons name='time-outline' size={16} color={theme.colors.warning} />
								<Text style={styles.timerText}>Hết hạn sau {countdown}</Text>
							</View>
						)}
					</View>

					{order.sepayQrUrl ? (
						<Image source={{ uri: order.sepayQrUrl }} style={styles.qr} resizeMode='contain' />
					) : (
						<ActivityIndicator style={{ marginVertical: 24 }} color={theme.colors.primary} />
					)}

					<View style={styles.codeCard}>
						<Text style={styles.codeLabel}>Nội dung chuyển khoản</Text>
						<Text style={styles.codeValue}>{order.paymentCode}</Text>
						<Text style={styles.codeHint}>
							Nhập đúng mã và số tiền {formatVnd(order.priceVnd)} khi chuyển khoản
						</Text>
					</View>

					<View style={styles.waitingCard}>
						<ActivityIndicator color={theme.colors.primary} />
						<View style={styles.waitingTextWrap}>
							<Text style={styles.waitingTitle}>Tự động xác nhận</Text>
							<Text style={styles.waitingDesc}>
								Không cần bấm xác nhận thủ công. Sau khi ngân hàng ghi nhận CK (đúng mã{' '}
								{order.paymentCode}), SePay báo về server và coin cộng vào ví — app kiểm
								tra mỗi vài giây.
							</Text>
						</View>
					</View>

					<TouchableOpacity
						style={styles.changePkgBtn}
						onPress={() => setOrder(null)}
						activeOpacity={0.88}
					>
						<Text style={styles.changePkgBtnText}>Chọn gói khác</Text>
					</TouchableOpacity>
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} color={theme.colors.foreground} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Nạp coin</Text>
				<View style={{ width: 24 }} />
			</View>

			{loading ? (
				<ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
			) : (
				<ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
					{renderRateBanner()}
					<Text style={styles.sectionTitle}>Gói nạp & khuyến mãi</Text>
					<Text style={styles.sectionSub}>
						Gói lớn hơn được thêm coin thưởng so với tỉ giá cơ bản
					</Text>
					{loadError ? (
						<View style={styles.errorBox}>
							<Ionicons name='cloud-offline-outline' size={28} color={theme.colors.error} />
							<Text style={styles.errorText}>{loadError}</Text>
							<TouchableOpacity style={styles.retryBtn} onPress={load}>
								<Text style={styles.retryBtnText}>Thử lại</Text>
							</TouchableOpacity>
						</View>
					) : packages.length === 0 ? (
						<Text style={styles.empty}>Chưa có gói nạp.</Text>
					) : (
						packages.map(renderPackage)
					)}
				</ScrollView>
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
	headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.foreground },
	listContent: { padding: 16, paddingBottom: 32 },
	rateCard: {
		backgroundColor: theme.colors.white,
		borderRadius: 16,
		padding: 16,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: 'rgba(31, 102, 80, 0.15)',
		...theme.shadows.soft,
	},
	rateRow: { flexDirection: 'row', alignItems: 'flex-start' },
	rateIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: theme.colors.backgroundLight,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	rateTextWrap: { flex: 1 },
	rateTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.foregroundMuted,
		marginBottom: 4,
	},
	rateValue: {
		fontSize: 20,
		fontWeight: '800',
		color: theme.colors.primary,
	},
	rateHint: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		marginTop: 6,
		lineHeight: 17,
	},
	balancePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 14,
		alignSelf: 'flex-start',
		backgroundColor: theme.colors.backgroundLight,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
	},
	balancePillText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
	sectionTitle: {
		fontSize: 17,
		fontWeight: '700',
		color: theme.colors.foreground,
		marginBottom: 4,
	},
	sectionSub: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginBottom: 14,
		lineHeight: 18,
	},
	pkgCard: {
		backgroundColor: theme.colors.white,
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		overflow: 'hidden',
		...theme.shadows.soft,
	},
	pkgCardBest: {
		borderColor: theme.colors.primary,
		borderWidth: 2,
	},
	hotBadge: {
		position: 'absolute',
		top: 12,
		right: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#ea580c',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		zIndex: 1,
	},
	hotBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
	promoBadge: {
		position: 'absolute',
		top: 12,
		right: 12,
		backgroundColor: '#dcfce7',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		zIndex: 1,
	},
	promoBadgeText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
	pkgTop: { marginBottom: 12, paddingRight: 72 },
	pkgName: { fontSize: 18, fontWeight: '800', color: theme.colors.foreground },
	pkgVnd: { fontSize: 15, color: theme.colors.foregroundMuted, marginTop: 2 },
	pkgBreakdown: {
		backgroundColor: theme.colors.backgroundLight,
		borderRadius: 12,
		padding: 12,
		marginBottom: 12,
	},
	breakdownRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	breakdownLabel: { fontSize: 13, color: theme.colors.foregroundMuted },
	breakdownValue: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground },
	breakdownSub: {
		fontSize: 11,
		color: theme.colors.foregroundMuted,
		marginTop: 2,
		marginBottom: 6,
	},
	bonusLabel: { color: '#16a34a' },
	bonusValue: { color: '#16a34a', fontWeight: '700' },
	pkgTotalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	pkgTotalLabel: { fontSize: 14, fontWeight: '600' },
	pkgTotalValue: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
	pkgCta: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	pkgCtaText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
	empty: { textAlign: 'center', color: theme.colors.foregroundMuted, marginTop: 24 },
	errorBox: {
		alignItems: 'center',
		padding: 20,
		backgroundColor: theme.colors.white,
		borderRadius: 14,
		marginTop: 8,
	},
	errorText: {
		textAlign: 'center',
		color: theme.colors.foregroundMuted,
		marginTop: 10,
		lineHeight: 20,
	},
	retryBtn: {
		marginTop: 14,
		paddingHorizontal: 20,
		paddingVertical: 10,
		backgroundColor: theme.colors.primary,
		borderRadius: 10,
	},
	retryBtnText: { color: '#fff', fontWeight: '700' },
	payContent: { padding: 16, paddingBottom: 40 },
	paySummary: {
		alignItems: 'center',
		marginBottom: 8,
	},
	payAmount: { fontSize: 28, fontWeight: '800', color: theme.colors.foreground },
	payCoinLine: { fontSize: 15, color: theme.colors.foregroundMuted, marginTop: 6, textAlign: 'center' },
	payCoinBold: { fontWeight: '800', color: theme.colors.primary },
	payCoinBonus: { fontSize: 13, color: '#16a34a' },
	timerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 10,
		backgroundColor: '#fef3c7',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	timerText: { fontSize: 13, fontWeight: '600', color: '#b45309' },
	qr: { width: '100%', height: 280, alignSelf: 'center', marginVertical: 12 },
	codeCard: {
		backgroundColor: theme.colors.white,
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	codeLabel: { fontSize: 12, color: theme.colors.foregroundMuted, marginBottom: 6 },
	codeValue: {
		fontSize: 22,
		fontWeight: '800',
		color: theme.colors.primary,
		letterSpacing: 1,
	},
	codeHint: { fontSize: 12, color: theme.colors.foregroundMuted, marginTop: 8, lineHeight: 17 },
	waitingCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		backgroundColor: '#ecfdf5',
		borderRadius: 14,
		padding: 14,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: 'rgba(31, 102, 80, 0.2)',
	},
	waitingTextWrap: { flex: 1 },
	waitingTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
	waitingDesc: {
		fontSize: 12,
		color: theme.colors.foregroundMuted,
		marginTop: 4,
		lineHeight: 17,
	},
	changePkgBtn: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
		paddingVertical: 14,
		paddingHorizontal: 20,
		backgroundColor: theme.colors.primaryDark,
		borderRadius: theme.borderRadius.md,
		shadowColor: theme.colors.primaryDark,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.35,
		shadowRadius: 6,
		elevation: 4,
	},
	changePkgBtnText: {
		color: theme.colors.white,
		fontWeight: '700',
		fontSize: 15,
	},
});

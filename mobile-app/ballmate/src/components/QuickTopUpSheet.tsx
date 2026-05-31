import React, { useEffect, useRef, useState } from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { formatCoin } from '../utils/coin';
import { hasActiveComboForPackage } from '../utils/combo';
import { useWallet } from '../context/WalletContext';

interface QuickTopUpSheetProps {
	visible: boolean;
	missingCoin: number;
	missingVnd?: number;
	holdId?: number;
	comboPackageId?: number;
	purpose?: 'BOOKING_JIT' | 'COMBO_JIT' | 'WALLET_TOPUP';
	onClose: () => void;
	onSuccess: () => void;
}

export default function QuickTopUpSheet({
	visible,
	missingCoin,
	missingVnd,
	holdId,
	comboPackageId,
	purpose = 'BOOKING_JIT',
	onClose,
	onSuccess,
}: QuickTopUpSheetProps) {
	const { refreshWallet } = useWallet();
	const [order, setOrder] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const fulfilledRef = useRef(false);

	const isCombo = purpose === 'COMBO_JIT';
	const title = isCombo ? 'Nạp coin để mua gói combo' : 'Nạp coin để hoàn tất đặt sân';

	useEffect(() => {
		if (!visible) {
			setOrder(null);
			setCreateError(null);
			fulfilledRef.current = false;
			if (pollRef.current) clearInterval(pollRef.current);
			return;
		}

		const create = async () => {
			setLoading(true);
			setCreateError(null);
			try {
				const amountVnd =
					missingVnd != null && missingVnd >= 1000
						? Math.round(missingVnd)
						: Math.ceil(missingCoin * 1000);
				const o = await api.createTopUpOrder({
					amountVnd,
					purpose,
					holdId,
					comboPackageId,
				});
				setOrder(o);
			} catch (e: unknown) {
				const ax = e as {
					response?: { status?: number; data?: { message?: string | string[] } };
				};
				const msg = ax.response?.data?.message;
				const text = Array.isArray(msg)
					? msg.join(', ')
					: typeof msg === 'string'
						? msg
						: 'Không tạo được đơn nạp coin. Thử lại sau.';
				setCreateError(text);
				console.error('[QuickTopUp]', e);
			} finally {
				setLoading(false);
			}
		};
		void create();
	}, [visible, missingCoin, missingVnd, holdId, comboPackageId, purpose]);

	useEffect(() => {
		if (!order?.id || fulfilledRef.current) return;

		const poll = async () => {
			try {
				const updated = await api.getTopUpOrder(order.id);
				if (updated.status !== 'PAID') return;

				if (pollRef.current) clearInterval(pollRef.current);

				if (isCombo && comboPackageId) {
					let fulfillment = updated.comboFulfillment as
						| { ok?: boolean; error?: string }
						| null
						| undefined;

					if (fulfillment?.ok !== true) {
						const again = await api.getTopUpOrder(order.id);
						fulfillment = again.comboFulfillment;
					}

					if (fulfillment?.ok === false) {
						Alert.alert(
							'Đã nạp coin',
							fulfillment.error ??
								'Coin đã vào ví nhưng chưa mua được gói. Bấm «Mua ngay» lại khi đủ coin.',
							[{ text: 'Đóng', onPress: onClose }],
						);
						return;
					}

					if (fulfillment?.ok !== true) {
						const combos = await api.getMyCombos();
						if (!hasActiveComboForPackage(combos, comboPackageId)) {
							return;
						}
					}
				}

				fulfilledRef.current = true;
				await refreshWallet(true);
				onSuccess();
			} catch {
				/* ignore transient poll errors */
			}
		};

		void poll();
		pollRef.current = setInterval(poll, 4000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [order?.id, isCombo, comboPackageId, onSuccess, onClose, refreshWallet]);

	return (
		<Modal visible={visible} animationType='slide' transparent>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					<View style={styles.header}>
						<Text style={styles.title}>{title}</Text>
						<TouchableOpacity onPress={onClose}>
							<Ionicons name='close' size={24} color={theme.colors.foreground} />
						</TouchableOpacity>
					</View>
					<Text style={styles.sub}>
						Bạn thiếu {formatCoin(missingCoin)}. Quét QR và chuyển khoản đúng mã bên dưới.
						{isCombo ? ' Sau khi nhận tiền, hệ thống tự mua gói combo.' : ''}
					</Text>
					{loading && <ActivityIndicator color={theme.colors.primary} />}
					{createError && (
						<View style={styles.errorCard}>
							<Text style={styles.errorText}>{createError}</Text>
							<TouchableOpacity style={styles.retryBtn} onPress={onClose}>
								<Text style={styles.retryBtnText}>Đóng</Text>
							</TouchableOpacity>
						</View>
					)}
					{order?.sepayQrUrl && (
						<Image source={{ uri: order.sepayQrUrl }} style={styles.qr} resizeMode='contain' />
					)}
					{order?.paymentCode && (
						<Text style={styles.code}>Mã CK: {order.paymentCode}</Text>
					)}
					{order?.priceVnd && (
						<Text style={styles.amount}>
							Số tiền: {order.priceVnd.toLocaleString('vi-VN')}đ
						</Text>
					)}
					{order && !loading && !createError && (
						<View style={styles.waitingCard}>
							<ActivityIndicator color={theme.colors.primary} size='small' />
							<Text style={styles.waitingText}>
								Tự động xác nhận sau khi chuyển khoản — giữ màn hình này.
							</Text>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: theme.colors.white,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		maxHeight: '85%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	title: { fontSize: 18, fontWeight: '700', flex: 1, paddingRight: 8 },
	sub: { color: theme.colors.foregroundMuted, marginBottom: 16, lineHeight: 20 },
	qr: { width: '100%', height: 220, marginBottom: 12 },
	code: { fontWeight: '600', textAlign: 'center', marginBottom: 4 },
	amount: { textAlign: 'center', marginBottom: 12 },
	waitingCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: '#ecfdf5',
		borderRadius: 12,
		padding: 12,
		marginTop: 4,
	},
	waitingText: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		lineHeight: 18,
	},
	errorCard: {
		backgroundColor: '#fef2f2',
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
	},
	errorText: { color: '#b91c1c', fontSize: 14, lineHeight: 20 },
	retryBtn: {
		marginTop: 10,
		alignSelf: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	retryBtnText: { color: theme.colors.primary, fontWeight: '700' },
});

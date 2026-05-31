import React, { useEffect, useRef, useState } from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { formatCoin } from '../utils/coin';

interface QuickTopUpSheetProps {
	visible: boolean;
	missingCoin: number;
	holdId?: number;
	comboPackageId?: number;
	purpose?: 'BOOKING_JIT' | 'COMBO_JIT' | 'WALLET_TOPUP';
	onClose: () => void;
	onSuccess: () => void;
}

export default function QuickTopUpSheet({
	visible,
	missingCoin,
	holdId,
	comboPackageId,
	purpose = 'BOOKING_JIT',
	onClose,
	onSuccess,
}: QuickTopUpSheetProps) {
	const [order, setOrder] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!visible) {
			setOrder(null);
			if (pollRef.current) clearInterval(pollRef.current);
			return;
		}

		const create = async () => {
			setLoading(true);
			try {
				const amountVnd = Math.ceil(missingCoin * 1000);
				const o = await api.createTopUpOrder({
					amountVnd,
					purpose,
					holdId,
					comboPackageId,
				});
				setOrder(o);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		create();
	}, [visible, missingCoin, holdId, comboPackageId, purpose]);

	useEffect(() => {
		if (!order?.id) return;

		const poll = async () => {
			try {
				const updated = await api.getTopUpOrder(order.id);
				if (updated.status === 'PAID') {
					if (pollRef.current) clearInterval(pollRef.current);
					onSuccess();
				}
			} catch {
				/* ignore */
			}
		};

		void poll();
		pollRef.current = setInterval(poll, 4000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [order?.id, onSuccess]);

	return (
		<Modal visible={visible} animationType='slide' transparent>
			<View style={styles.overlay}>
				<View style={styles.sheet}>
					<View style={styles.header}>
						<Text style={styles.title}>Nạp coin để hoàn tất đặt sân</Text>
						<TouchableOpacity onPress={onClose}>
							<Ionicons name='close' size={24} color={theme.colors.foreground} />
						</TouchableOpacity>
					</View>
					<Text style={styles.sub}>
						Bạn thiếu {formatCoin(missingCoin)}. Quét QR và chuyển khoản đúng mã bên dưới.
					</Text>
					{loading && <ActivityIndicator color={theme.colors.primary} />}
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
					{order && !loading && (
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
	title: { fontSize: 18, fontWeight: '700', flex: 1 },
	sub: { color: theme.colors.foregroundMuted, marginBottom: 16 },
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
});

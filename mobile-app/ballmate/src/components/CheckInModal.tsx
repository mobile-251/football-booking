import React from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { formatCoin } from '../utils/coin';

export interface CheckInStatusData {
	checkedInToday: boolean;
	currentStreak: number;
	todayReward: number;
	previewDays?: { day: number; coin: number }[];
}

interface CheckInModalProps {
	visible: boolean;
	status: CheckInStatusData | null;
	loading?: boolean;
	onCheckIn: () => void;
	onDismiss: () => void;
}

export default function CheckInModal({
	visible,
	status,
	loading,
	onCheckIn,
	onDismiss,
}: CheckInModalProps) {
	if (!status || status.checkedInToday) return null;

	return (
		<Modal visible={visible} transparent animationType='fade' onRequestClose={onDismiss}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					<TouchableOpacity style={styles.close} onPress={onDismiss} hitSlop={12}>
						<Ionicons name='close' size={22} color={theme.colors.foregroundMuted} />
					</TouchableOpacity>

					<View style={styles.flameWrap}>
						<Ionicons name='flame' size={48} color='#f59e0b' />
					</View>

					<Text style={styles.title}>Điểm danh hôm nay</Text>
					<Text style={styles.subtitle}>
						Streak {status.currentStreak > 0 ? status.currentStreak : 0} ngày — nhận thưởng ngay!
					</Text>

					<View style={styles.rewardBox}>
						<Text style={styles.rewardLabel}>Phần thưởng hôm nay</Text>
						<Text style={styles.rewardValue}>+{formatCoin(status.todayReward)}</Text>
					</View>

					{status.previewDays && status.previewDays.length > 0 && (
						<View style={styles.previewRow}>
							{status.previewDays.slice(0, 7).map((d, i) => (
								<View key={i} style={styles.previewDay}>
									<Text style={styles.previewCoin}>{d.coin}</Text>
									<Text style={styles.previewLabel}>D{d.day}</Text>
								</View>
							))}
						</View>
					)}

					<TouchableOpacity
						style={styles.primaryBtn}
						onPress={onCheckIn}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color='#fff' />
						) : (
							<Text style={styles.primaryBtnText}>Điểm danh ngay</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
						<Text style={styles.secondaryBtnText}>Để sau</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	card: {
		width: '100%',
		maxWidth: 340,
		backgroundColor: theme.colors.white,
		borderRadius: 24,
		padding: 24,
		alignItems: 'center',
	},
	close: {
		position: 'absolute',
		top: 12,
		right: 12,
		zIndex: 1,
	},
	flameWrap: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#fef3c7',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	title: {
		fontSize: 22,
		fontWeight: '800',
		color: theme.colors.foreground,
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		textAlign: 'center',
		marginBottom: 16,
	},
	rewardBox: {
		width: '100%',
		backgroundColor: theme.colors.primary + '15',
		borderRadius: 16,
		padding: 16,
		alignItems: 'center',
		marginBottom: 16,
	},
	rewardLabel: { fontSize: 13, color: theme.colors.foregroundMuted },
	rewardValue: {
		fontSize: 28,
		fontWeight: '800',
		color: theme.colors.primary,
		marginTop: 4,
	},
	previewRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 20,
	},
	previewDay: { alignItems: 'center', flex: 1 },
	previewCoin: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
	previewLabel: { fontSize: 10, color: theme.colors.foregroundMuted, marginTop: 2 },
	primaryBtn: {
		width: '100%',
		backgroundColor: theme.colors.primary,
		paddingVertical: 14,
		borderRadius: 14,
		alignItems: 'center',
		marginBottom: 10,
	},
	primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	secondaryBtn: { paddingVertical: 8 },
	secondaryBtnText: { color: theme.colors.foregroundMuted, fontSize: 14 },
});

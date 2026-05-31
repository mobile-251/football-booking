import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { formatCoin } from '../utils/coin';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { useWallet } from '../context/WalletContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function WalletScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { balance, refreshWallet } = useWallet();
	const [transactions, setTransactions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const loadTransactions = useCallback(async (silent = false) => {
		try {
			if (!silent) setLoading(true);
			await refreshWallet(true);
			const tx = await api.getWalletTransactions(1, 30);
			setTransactions(tx.transactions ?? []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [refreshWallet]);

	useRefreshOnFocus(() => loadTransactions(true), true);

	const onRefresh = () => {
		setRefreshing(true);
		void loadTransactions(true);
	};

	const displayBalance = balance ?? 0;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} color={theme.colors.foreground} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Ví coin</Text>
				<TouchableOpacity onPress={onRefresh} hitSlop={12}>
					<Ionicons name='refresh' size={22} color={theme.colors.primary} />
				</TouchableOpacity>
			</View>
			{loading && balance == null ? (
				<ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
			) : (
				<>
					<View style={styles.balanceCard}>
						<Text style={styles.balanceLabel}>Số dư</Text>
						<Text style={styles.balanceValue}>{formatCoin(displayBalance)}</Text>
						<TouchableOpacity
							style={styles.topUpBtn}
							onPress={() => navigation.navigate('TopUp')}
						>
							<Ionicons name='add-circle' size={20} color={theme.colors.primary} />
							<Text style={styles.topUpBtnText}>Nạp coin ngay</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.hintCard}>
						<Ionicons name='information-circle-outline' size={20} color='#7c3aed' />
						<Text style={styles.hintText}>
							Mua gói combo tiết kiệm tại trang chi tiết từng cụm sân (mục Coin & gói combo).
						</Text>
						<TouchableOpacity onPress={() => navigation.navigate('MyCombos')}>
							<Text style={styles.hintLink}>Gói đang có →</Text>
						</TouchableOpacity>
					</View>
					<Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
					<FlatList
						data={transactions}
						keyExtractor={(item) => String(item.id)}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
						renderItem={({ item }) => (
							<View style={styles.txRow}>
								<View>
									<Text style={styles.txType}>{item.type}</Text>
									<Text style={styles.txDate}>
										{new Date(item.createdAt).toLocaleString('vi-VN')}
									</Text>
								</View>
								<Text
									style={[
										styles.txAmount,
										Number(item.amount) >= 0 ? styles.positive : styles.negative,
									]}
								>
									{Number(item.amount) >= 0 ? '+' : ''}
									{Number(item.amount)} coin
								</Text>
							</View>
						)}
						ListEmptyComponent={
							<Text style={styles.empty}>Chưa có giao dịch</Text>
						}
					/>
				</>
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
	},
	headerTitle: { fontSize: 18, fontWeight: '700' },
	balanceCard: {
		margin: 16,
		padding: 24,
		backgroundColor: theme.colors.primary,
		borderRadius: 16,
	},
	balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
	balanceValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginVertical: 8 },
	topUpBtn: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		padding: 12,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: 8,
	},
	topUpBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
	hintCard: {
		marginHorizontal: 16,
		marginBottom: 16,
		padding: 14,
		backgroundColor: '#f5f3ff',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#ede9fe',
	},
	hintText: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		lineHeight: 18,
		marginTop: 8,
		marginBottom: 8,
	},
	hintLink: {
		fontSize: 13,
		fontWeight: '700',
		color: '#7c3aed',
	},
	sectionTitle: {
		marginHorizontal: 16,
		marginBottom: 8,
		fontWeight: '600',
		fontSize: 16,
	},
	txRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 14,
		marginHorizontal: 16,
		marginBottom: 8,
		backgroundColor: theme.colors.white,
		borderRadius: 10,
	},
	txType: { fontWeight: '600' },
	txDate: { fontSize: 12, color: theme.colors.foregroundMuted, marginTop: 2 },
	txAmount: { fontWeight: '700' },
	positive: { color: '#16a34a' },
	negative: { color: '#dc2626' },
	empty: { textAlign: 'center', marginTop: 24, color: theme.colors.foregroundMuted },
});

import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { formatCoin } from '../utils/coin';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import QuickTopUpSheet from '../components/QuickTopUpSheet';

export default function ComboMarketScreen() {
	const navigation = useNavigation();
	const route = useRoute<RouteProp<RootStackParamList, 'ComboMarket'>>();
	const { venueId } = route.params;
	const [packages, setPackages] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [jit, setJit] = useState<{ missingCoin: number; comboPackageId: number } | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const list = await api.getComboPackages(venueId);
			setPackages(list);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, [venueId]);

	useRefreshOnFocus(load, true);

	const purchase = async (id: number) => {
		try {
			await api.purchaseCombo(id);
			Alert.alert('Thành công', 'Đã mua gói combo');
			load();
		} catch (err: any) {
			const data = err?.response?.data;
			if (err?.response?.status === 402 && data?.missingCoin) {
				setJit({ missingCoin: data.missingCoin, comboPackageId: id });
			} else {
				Alert.alert('Lỗi', 'Không thể mua gói');
			}
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Gói combo</Text>
				<TouchableOpacity onPress={() => navigation.navigate('MyCombos' as never)}>
					<Text style={styles.link}>Của tôi</Text>
				</TouchableOpacity>
			</View>
			{loading ? (
				<ActivityIndicator style={{ marginTop: 40 }} />
			) : (
				<FlatList
					data={packages}
					keyExtractor={(item) => String(item.id)}
					contentContainerStyle={{ padding: 16 }}
					renderItem={({ item }) => (
						<View style={styles.card}>
							<Text style={styles.name}>{item.name}</Text>
							<Text>
								{item.matchCount} lượt · {item.validityDays} ngày
							</Text>
							<Text style={styles.price}>{formatCoin(item.priceCoin)}</Text>
							<TouchableOpacity style={styles.btn} onPress={() => purchase(item.id)}>
								<Text style={styles.btnText}>Mua ngay</Text>
							</TouchableOpacity>
						</View>
					)}
				/>
			)}
			{jit && (
				<QuickTopUpSheet
					visible
					missingCoin={jit.missingCoin}
					comboPackageId={jit.comboPackageId}
					purpose='COMBO_JIT'
					onClose={() => setJit(null)}
					onSuccess={async () => {
						try {
							await api.purchaseCombo(jit.comboPackageId);
							Alert.alert('Thành công', 'Đã mua gói combo');
						} catch {
							/* webhook may have purchased */
						}
						setJit(null);
						load();
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
	},
	headerTitle: { fontSize: 18, fontWeight: '700' },
	link: { color: theme.colors.primary, fontWeight: '600' },
	card: {
		backgroundColor: theme.colors.white,
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},
	name: { fontSize: 16, fontWeight: '700' },
	price: { fontSize: 20, fontWeight: '800', color: theme.colors.primary, marginVertical: 8 },
	btn: {
		backgroundColor: theme.colors.primary,
		padding: 12,
		borderRadius: 10,
		alignItems: 'center',
	},
	btnText: { color: '#fff', fontWeight: '600' },
});

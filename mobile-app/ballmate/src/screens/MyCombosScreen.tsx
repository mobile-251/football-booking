import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

export default function MyCombosScreen() {
	const navigation = useNavigation();
	const [combos, setCombos] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const list = await api.getMyCombos();
			setCombos(list);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, []);

	useRefreshOnFocus(load, true);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Gói combo của tôi</Text>
				<View style={{ width: 24 }} />
			</View>
			{loading ? (
				<ActivityIndicator style={{ marginTop: 40 }} />
			) : (
				<FlatList
					data={combos}
					keyExtractor={(item) => String(item.id)}
					contentContainerStyle={{ padding: 16 }}
					renderItem={({ item }) => (
						<View style={styles.card}>
							<Text style={styles.name}>{item.comboPackage?.name}</Text>
							<Text>
								Còn {item.matchesRemaining}/{item.matchesTotal} lượt
							</Text>
							<Text style={styles.exp}>
								HSD: {new Date(item.expiresAt).toLocaleDateString('vi-VN')}
							</Text>
						</View>
					)}
					ListEmptyComponent={
						<Text style={styles.empty}>Chưa có gói combo</Text>
					}
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
	card: {
		backgroundColor: theme.colors.white,
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},
	name: { fontWeight: '700', fontSize: 16 },
	exp: { marginTop: 4, color: theme.colors.foregroundMuted, fontSize: 13 },
	empty: { textAlign: 'center', marginTop: 32, color: theme.colors.foregroundMuted },
});

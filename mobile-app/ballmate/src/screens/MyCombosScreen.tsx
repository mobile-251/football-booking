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
import { theme } from '../constants/theme';
import { api } from '../services/api';
import { formatCoin } from '../utils/coin';
import { fieldTypeLabel } from '../utils/combo';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

type PlayerComboRow = {
	id: number;
	matchesRemaining: number;
	matchesTotal: number;
	expiresAt: string;
	comboPackage?: {
		name?: string;
		fieldType?: string;
		venue?: { name?: string };
	};
};

export default function MyCombosScreen() {
	const navigation = useNavigation();
	const [combos, setCombos] = useState<PlayerComboRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const load = useCallback(async (silent = false) => {
		try {
			if (!silent) setLoading(true);
			const list = await api.getMyCombos();
			setCombos(Array.isArray(list) ? list : []);
		} catch (e) {
			console.error('[MyCombos]', e);
			setCombos([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useRefreshOnFocus(() => load(true), true);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Ionicons name='arrow-back' size={24} color={theme.colors.foreground} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Gói combo của tôi</Text>
				<View style={{ width: 24 }} />
			</View>
			{loading ? (
				<ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
			) : (
				<FlatList
					data={combos}
					keyExtractor={(item) => String(item.id)}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								setRefreshing(true);
								load(true);
							}}
						/>
					}
					renderItem={({ item }) => (
						<View style={styles.card}>
							<View style={styles.venueRow}>
								<Ionicons name='location' size={14} color={theme.colors.primary} />
								<Text style={styles.venueName}>
									{item.comboPackage?.venue?.name ?? 'Cụm sân'}
								</Text>
							</View>
							<Text style={styles.name}>{item.comboPackage?.name ?? 'Gói combo'}</Text>
							{item.comboPackage?.fieldType ? (
								<Text style={styles.fieldType}>
									{fieldTypeLabel(item.comboPackage.fieldType)}
								</Text>
							) : null}
							<View style={styles.statsRow}>
								<Text style={styles.stat}>
									Còn{' '}
									<Text style={styles.statBold}>
										{item.matchesRemaining}/{item.matchesTotal}
									</Text>{' '}
									lượt
								</Text>
								<Text style={styles.exp}>
									HSD: {new Date(item.expiresAt).toLocaleDateString('vi-VN')}
								</Text>
							</View>
						</View>
					)}
					ListEmptyComponent={
						<View style={styles.emptyWrap}>
							<Ionicons name='ticket-outline' size={44} color={theme.colors.foregroundMuted} />
							<Text style={styles.empty}>Chưa có gói combo</Text>
							<Text style={styles.emptyHint}>
								Mua gói tại trang chi tiết cụm sân → Mua gói combo
							</Text>
						</View>
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
		backgroundColor: theme.colors.white,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	headerTitle: { fontSize: 18, fontWeight: '700' },
	listContent: { padding: 16, flexGrow: 1 },
	card: {
		backgroundColor: theme.colors.white,
		padding: 16,
		borderRadius: 14,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	venueRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginBottom: 2,
	},
	venueName: {
		fontSize: 13,
		color: theme.colors.primary,
		fontWeight: '700',
		flex: 1,
	},
	name: { fontWeight: '800', fontSize: 17, color: theme.colors.foreground, marginTop: 4 },
	fieldType: {
		alignSelf: 'flex-start',
		marginTop: 6,
		fontSize: 11,
		fontWeight: '700',
		color: '#7c3aed',
		backgroundColor: '#ede9fe',
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		overflow: 'hidden',
	},
	statsRow: { marginTop: 12, gap: 4 },
	stat: { fontSize: 14, color: theme.colors.foreground },
	statBold: { fontWeight: '800', color: theme.colors.primary },
	exp: { fontSize: 13, color: theme.colors.foregroundMuted },
	emptyWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
	empty: {
		textAlign: 'center',
		marginTop: 12,
		fontSize: 16,
		fontWeight: '700',
		color: theme.colors.foreground,
	},
	emptyHint: {
		textAlign: 'center',
		marginTop: 8,
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		lineHeight: 18,
	},
});

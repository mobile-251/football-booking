import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

interface Transaction {
	id: number;
	fieldName: string;
	fieldType: string;
	date: string;
	time: string;
	paymentMethod: string;
	amount: number;
	transactionId: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
	{
		id: 1,
		fieldName: 'Sân Bóng Đá Làng Đại Học',
		fieldType: 'Sân 5, 7 người',
		date: '09/10/2025',
		time: '18:51',
		paymentMethod: 'MoMo',
		amount: 3550000,
		transactionId: 'TXN001',
	},
	{
		id: 2,
		fieldName: 'Sân Bóng Đá Làng Đại Học',
		fieldType: 'Sân 5, 7 người',
		date: '09/10/2025',
		time: '18:51',
		paymentMethod: 'MoMo',
		amount: 3550000,
		transactionId: 'TXN001',
	},
	{
		id: 3,
		fieldName: 'Sân Bóng Đá Làng Đại Học',
		fieldType: 'Sân 5, 7 người',
		date: '09/10/2025',
		time: '18:51',
		paymentMethod: 'MoMo',
		amount: 3550000,
		transactionId: 'TXN001',
	},
];

export default function TransactionHistoryScreen() {
	const navigation = useNavigation();

	const totalThisMonth = MOCK_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0);
	const transactionCount = MOCK_TRANSACTIONS.length;

	const renderTransaction = ({ item }: { item: Transaction }) => (
		<View style={styles.transactionCard}>
			<Text style={styles.fieldName}>{item.fieldName}</Text>
			<Text style={styles.fieldType}>{item.fieldType}</Text>

			<View style={styles.detailsRow}>
				<View style={styles.detailItem}>
					<Text style={styles.detailLabel}>Ngày đặt</Text>
					<View style={styles.detailValue}>
						<Ionicons name='calendar-outline' size={14} color={theme.colors.foreground} />
						<Text style={styles.detailText}>{item.date}</Text>
					</View>
				</View>
				<View style={styles.detailItem}>
					<Text style={styles.detailLabel}>Thời gian</Text>
					<View style={styles.detailValue}>
						<Ionicons name='time-outline' size={14} color={theme.colors.foreground} />
						<Text style={styles.detailText}>{item.time}</Text>
					</View>
				</View>
			</View>

			<View style={styles.paymentRow}>
				<View style={styles.paymentMethod}>
					<Ionicons name='wallet-outline' size={14} color={theme.colors.foreground} />
					<Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
				</View>
				<View style={styles.amountContainer}>
					<Text style={styles.amount}>{formatPrice(item.amount)}</Text>
					<Text style={styles.transactionId}>Mã: {item.transactionId}</Text>
				</View>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container} edges={['top']}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
						<Ionicons name='chevron-back' size={24} color={theme.colors.white} />
					</TouchableOpacity>
					<Text style={styles.title}>Lịch sử giao dịch</Text>
					<View style={{ width: 40 }} />
				</View>

				{/* Stats Cards */}
				<View style={styles.statsContainer}>
					<View style={styles.statCard}>
						<View style={styles.statHeader}>
							<Ionicons name='trending-up' size={16} color={theme.colors.white} />
							<Text style={styles.statLabel}>Tháng này</Text>
						</View>
						<Text style={styles.statValue}>{formatPrice(totalThisMonth)}</Text>
						<Text style={styles.statSub}>+450K so với tháng trước</Text>
					</View>
					<View style={styles.statCard}>
						<View style={styles.statHeader}>
							<Ionicons name='receipt-outline' size={16} color={theme.colors.white} />
							<Text style={styles.statLabel}>Tổng chi tiêu</Text>
						</View>
						<Text style={styles.statValue}>{formatPrice(totalThisMonth)}</Text>
						<Text style={styles.statSub}>{transactionCount} giao dịch</Text>
					</View>
				</View>
			</View>

			{/* Transactions List */}
			<FlatList
				data={MOCK_TRANSACTIONS}
				renderItem={renderTransaction}
				keyExtractor={(item) => item.id.toString()}
				style={styles.list}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Ionicons name='receipt-outline' size={64} color={theme.colors.secondary} />
						<Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
						<Text style={styles.emptyText}>Bạn chưa có giao dịch nào.</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.sm,
		paddingBottom: theme.spacing.lg,
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
	statsContainer: {
		flexDirection: 'row',
		gap: 12,
	},
	statCard: {
		flex: 1,
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
	},
	statHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 8,
	},
	statLabel: {
		fontSize: 12,
		color: theme.colors.white,
		opacity: 0.9,
	},
	statValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.white,
		marginBottom: 4,
	},
	statSub: {
		fontSize: 11,
		color: theme.colors.white,
		opacity: 0.7,
	},
	list: {
		flex: 1,
	},
	listContent: {
		padding: theme.spacing.lg,
	},
	transactionCard: {
		backgroundColor: theme.colors.white,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		...theme.shadows.soft,
	},
	fieldName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginBottom: 4,
	},
	fieldType: {
		fontSize: 13,
		color: theme.colors.foregroundMuted,
		marginBottom: theme.spacing.md,
	},
	detailsRow: {
		flexDirection: 'row',
		marginBottom: theme.spacing.md,
	},
	detailItem: {
		flex: 1,
	},
	detailLabel: {
		fontSize: 11,
		color: theme.colors.foregroundMuted,
		marginBottom: 4,
	},
	detailValue: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	detailText: {
		fontSize: 14,
		fontWeight: '500',
		color: theme.colors.foreground,
	},
	paymentRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: theme.spacing.md,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	paymentMethod: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	paymentMethodText: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	amountContainer: {
		alignItems: 'flex-end',
	},
	amount: {
		fontSize: 18,
		fontWeight: 'bold',
		color: theme.colors.primary,
	},
	transactionId: {
		fontSize: 11,
		color: theme.colors.foregroundMuted,
		marginTop: 2,
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
});

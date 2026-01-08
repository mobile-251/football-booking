import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export default function MapScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Ionicons name="construct-outline" size={80} color={theme.colors.primary} />
				<Text style={styles.title}>Tính năng đang hoàn thiện</Text>
				<Text style={styles.subtitle}>
					Chúng tôi đang nỗ lực để mang đến trải nghiệm bản đồ tốt nhất cho bạn.
					Vui lòng quay lại sau!
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.foregroundMuted,
		textAlign: 'center',
		lineHeight: 24,
	},
});

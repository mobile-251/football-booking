import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface Props {
	children: ReactNode;
	fallbackMessage?: string;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Ionicons name='warning-outline' size={64} color={theme.colors.accent} />
					<Text style={styles.title}>Đã xảy ra lỗi</Text>
					<Text style={styles.message}>
						{this.props.fallbackMessage || 'Không thể tải màn hình này. Vui lòng thử lại.'}
					</Text>
					{__DEV__ && this.state.error && <Text style={styles.errorText}>{this.state.error.toString()}</Text>}
					<TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false, error: null })}>
						<Text style={styles.buttonText}>Thử lại</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
		backgroundColor: theme.colors.background,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: theme.colors.foreground,
		marginTop: theme.spacing.lg,
		marginBottom: theme.spacing.sm,
	},
	message: {
		fontSize: 14,
		color: theme.colors.foregroundMuted,
		textAlign: 'center',
		marginBottom: theme.spacing.lg,
	},
	errorText: {
		fontSize: 12,
		color: theme.colors.accent,
		textAlign: 'center',
		marginBottom: theme.spacing.lg,
		padding: theme.spacing.md,
		backgroundColor: theme.colors.card,
		borderRadius: theme.borderRadius.sm,
	},
	button: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.spacing.xl,
		paddingVertical: theme.spacing.md,
		borderRadius: theme.borderRadius.lg,
	},
	buttonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
});

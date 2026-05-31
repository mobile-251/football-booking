import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBadges } from '../navigation/AppNavigator';

type Props = {
	color?: string;
	size?: number;
	style?: ViewStyle;
};

export default function NotificationBell({ color = theme.colors.white, size = 24, style }: Props) {
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();
	const { unreadNotifications } = useBadges();

	return (
		<TouchableOpacity
			style={[styles.btn, style]}
			onPress={() => navigation.navigate('Notifications')}
			accessibilityLabel='Thông báo'
		>
			<Ionicons name='notifications-outline' size={size} color={color} />
			{unreadNotifications > 0 && (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>
						{unreadNotifications > 99 ? '99+' : unreadNotifications}
					</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	btn: {
		position: 'relative',
		padding: 4,
	},
	badge: {
		position: 'absolute',
		top: 0,
		right: 0,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: '#ef4444',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
		borderWidth: 2,
		borderColor: theme.colors.primary,
	},
	badgeText: {
		color: theme.colors.white,
		fontSize: 10,
		fontWeight: '700',
	},
});

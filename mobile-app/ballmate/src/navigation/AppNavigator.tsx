import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FieldDetailScreen from '../screens/FieldDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VenueDetailScreen from '../screens/VenueDetailScreen';

export type RootStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	MainTabs: undefined;
	VenueDetail: { venueId: number };
	FieldDetail: { fieldId: number };
	Booking: { fieldId: number };
	Chat: { conversationId: number; fieldName: string; fieldImage: string };
	Notifications: undefined;
	TransactionHistory: undefined;
	Favorites: undefined;
	PersonalInfo: undefined;
};

export type MainTabParamList = {
	Home: undefined;
	Map: undefined;
	Schedule: undefined;
	Messages: undefined;
	Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Badge Context for real-time counts
interface BadgeContextType {
	unreadMessages: number;
	upcomingBookings: number;
	refreshBadges: () => void;
}

const BadgeContext = createContext<BadgeContextType>({
	unreadMessages: 0,
	upcomingBookings: 0,
	refreshBadges: () => { },
});

export function useBadges() {
	return useContext(BadgeContext);
}

function BadgeProvider({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [unreadMessages, setUnreadMessages] = useState(0);
	const [upcomingBookings, setUpcomingBookings] = useState(0);

	const refreshBadges = useCallback(async () => {
		if (!isAuthenticated) {
			setUnreadMessages(0);
			setUpcomingBookings(0);
			return;
		}

		try {
			// Load unread messages count
			const conversations = await api.getConversations();
			const unread = conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
			setUnreadMessages(unread);
		} catch (error) {
			console.log('Failed to load unread messages:', error);
		}

		try {
			// Load upcoming bookings count
			const playerId = api.currentUser?.player?.id;
			const bookings = await api.getBookings(playerId ? { playerId } : undefined);
			const now = Date.now();
			const upcoming = bookings.filter((b: any) => {
				const start = b?.startTime ? Date.parse(b.startTime) : NaN;
				const isFuture = Number.isFinite(start) ? start >= now : true;
				return isFuture && (b.status === 'CONFIRMED' || b.status === 'PENDING');
			}).length;
			setUpcomingBookings(upcoming);
		} catch (error) {
			console.log('Failed to load bookings:', error);
		}
	}, [isAuthenticated]);

	useEffect(() => {
		refreshBadges();
	}, [isAuthenticated]);

	return (
		<BadgeContext.Provider value={{ unreadMessages, upcomingBookings, refreshBadges }}>
			{children}
		</BadgeContext.Provider>
	);
}

interface TabIconProps {
	focused: boolean;
	iconName: keyof typeof Ionicons.glyphMap;
	label: string;
	badge?: number;
	buttonWidth?: number;
}

function TabIcon({ focused, iconName, label, badge, buttonWidth }: TabIconProps) {
	const iconColor = focused ? theme.colors.white : theme.colors.foregroundMuted;

	return (
		<View style={styles.tabItem}>
			<View style={[styles.tabButton, buttonWidth ? { width: buttonWidth } : null, focused && styles.tabButtonActive]}>
				<View style={styles.iconWrapper}>
					<Ionicons name={iconName} size={20} color={iconColor} />
					{badge !== undefined && badge > 0 && (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
						</View>
					)}
				</View>
				<Text numberOfLines={1} ellipsizeMode='tail' style={[styles.tabLabel, focused && styles.tabLabelActive]}>
					{label}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	tabItem: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 4,
		paddingBottom: 6,
		position: 'relative',
	},
	tabButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 52,
		borderRadius: 18,
		paddingTop: 0,
		paddingBottom: 0,
		paddingHorizontal: 4,
		backgroundColor: 'transparent',
		position: 'relative',
	},
	tabButtonActive: {
		backgroundColor: theme.colors.primary,
	},
	iconWrapper: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		width: 24,
		height: 24,
	},
	tabLabel: {
		marginTop: 2,
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '600',
		color: theme.colors.foregroundMuted,
	},
	tabLabelActive: {
		color: theme.colors.white,
		fontWeight: '600',
	},
	dot: {
		position: 'absolute',
		left: '50%',
		bottom: -3,
		marginLeft: -3,
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: theme.colors.white,
	},
	dotHidden: {
		opacity: 0,
	},
	badge: {
		position: 'absolute',
		top: -6,
		right: -6,
		backgroundColor: theme.colors.accentDark,
		borderRadius: 9,
		minWidth: 18,
		height: 18,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 3,
		borderWidth: 0,
	},
	badgeText: {
		fontSize: 10,
		fontWeight: 'bold',
		color: theme.colors.white,
	},
});

function MainTabsContent() {
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const { unreadMessages, upcomingBookings, refreshBadges } = useBadges();
	// Keep the whole bar (including icons) closer to the bottom on iOS.
	const tabBarBottom = Platform.OS === 'web' ? theme.spacing.sm : 0;
	const tabBarHeight = 74;

	// Responsive, equal width for all 5 tabs; clamp to avoid overflow on small screens.
	const availableWidth = windowWidth - theme.spacing.md * 2 - theme.spacing.sm * 2;
	const rawTabWidth = Math.floor(availableWidth / 5);
	const tabButtonWidth = Math.max(56, Math.min(100, rawTabWidth));

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					position: 'absolute',
					left: theme.spacing.md,
					right: theme.spacing.md,
					bottom: tabBarBottom,
					height: tabBarHeight,
					paddingHorizontal: theme.spacing.sm,
					paddingTop: 4,
					paddingBottom: 4,
					borderRadius: 20,
					backgroundColor: theme.colors.cardSolid,
					borderTopWidth: 0,
					...theme.shadows.strong,
				},
				tabBarIconStyle: {
					flex: 1,
					width: '100%',
					height: '100%',
				},
				tabBarItemStyle: {
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					paddingVertical: 0,
				},
				tabBarShowLabel: false,
				tabBarHideOnKeyboard: true,
			}}
		>
			<Tab.Screen
				name='Home'
				component={HomeScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} iconName='home-outline' label='Trang chủ' buttonWidth={tabButtonWidth} />
					),
				}}
				listeners={{ focus: refreshBadges }}
			/>
			<Tab.Screen
				name='Map'
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} iconName='map-outline' label='Bản đồ' buttonWidth={tabButtonWidth} />
					),
				}}
				listeners={{ focus: refreshBadges }}
			>
				{() => (
					<ErrorBoundary fallbackMessage='Không thể tải bản đồ. Chức năng này đang được phát triển.'>
						<MapScreen />
					</ErrorBoundary>
				)}
			</Tab.Screen>
			<Tab.Screen
				name='Schedule'
				component={ScheduleScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							iconName='calendar-outline'
							label='Lịch đặt'
							badge={upcomingBookings > 0 ? upcomingBookings : undefined}
							buttonWidth={tabButtonWidth}
						/>
					),
				}}
				listeners={{ focus: refreshBadges }}
			/>
			<Tab.Screen
				name='Messages'
				component={MessagesScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							iconName='chatbubbles-outline'
							label='Tin nhắn'
							badge={unreadMessages > 0 ? unreadMessages : undefined}
							buttonWidth={tabButtonWidth}
						/>
					),
				}}
				listeners={{ focus: refreshBadges }}
			/>
			<Tab.Screen
				name='Profile'
				component={ProfileScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} iconName='person-outline' label='Tài khoản' buttonWidth={tabButtonWidth} />
					),
				}}
				listeners={{ focus: refreshBadges }}
			/>
		</Tab.Navigator>
	);
}

function MainTabs() {
	return (
		<BadgeProvider>
			<MainTabsContent />
		</BadgeProvider>
	);
}

export default function AppNavigator() {
	return (
		<NavigationContainer>
			<Stack.Navigator
				screenOptions={{
					headerShown: false,
				}}
			>
				<Stack.Screen name='Welcome' component={WelcomeScreen} />
				<Stack.Screen name='Login' component={LoginScreen} />
				<Stack.Screen name='Register' component={RegisterScreen} />
				<Stack.Screen name='MainTabs' component={MainTabs} />
				<Stack.Screen
					name='FieldDetail'
					component={FieldDetailScreen}
					options={{
						headerShown: true,
						headerTitle: 'Chi tiết sân',
						headerTintColor: theme.colors.primary,
						headerStyle: {
							backgroundColor: theme.colors.white,
						},
					}}
				/>
				<Stack.Screen
					name='VenueDetail'
					component={VenueDetailScreen}
					options={{
						headerShown: true,
						headerTitle: 'Chi tiết sân',
						headerTintColor: theme.colors.primary,
						headerStyle: {
							backgroundColor: theme.colors.white,
						},
					}}
				/>
				<Stack.Screen
					name='Chat'
					component={ChatScreen}
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name='Notifications'
					component={NotificationsScreen}
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name='TransactionHistory'
					component={TransactionHistoryScreen}
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name='Favorites'
					component={FavoritesScreen}
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name='PersonalInfo'
					component={PersonalInfoScreen}
					options={{
						headerShown: false,
					}}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}

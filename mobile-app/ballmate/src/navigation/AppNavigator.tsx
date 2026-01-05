import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ErrorBoundary } from '../components/ErrorBoundary';

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

export type RootStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	MainTabs: undefined;
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

function MainTabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarStyle: {
					backgroundColor: theme.colors.white,
					borderTopWidth: 1,
					borderTopColor: theme.colors.border,
					paddingTop: 8,
					paddingBottom: 8,
					height: 70,
				},
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.foregroundMuted,
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: '500',
					marginTop: 4,
				},
				tabBarIcon: ({ focused, color, size }) => {
					let iconName: keyof typeof Ionicons.glyphMap = 'home';

					if (route.name === 'Home') {
						iconName = focused ? 'home' : 'home-outline';
					} else if (route.name === 'Map') {
						iconName = focused ? 'map' : 'map-outline';
					} else if (route.name === 'Schedule') {
						iconName = focused ? 'calendar' : 'calendar-outline';
					} else if (route.name === 'Messages') {
						iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
					} else if (route.name === 'Profile') {
						iconName = focused ? 'person' : 'person-outline';
					}

					return <Ionicons name={iconName} size={24} color={color} />;
				},
			})}
		>
			<Tab.Screen name='Home' component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
			<Tab.Screen name='Map' options={{ tabBarLabel: 'Bản đồ' }}>
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
					tabBarLabel: 'Lịch đặt',
					tabBarBadge: 2,
				}}
			/>
			<Tab.Screen
				name='Messages'
				component={MessagesScreen}
				options={{
					tabBarLabel: 'Tin nhắn',
					tabBarBadge: 3,
				}}
			/>
			<Tab.Screen name='Profile' component={ProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
		</Tab.Navigator>
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

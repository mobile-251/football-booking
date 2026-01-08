import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { api } from '../services/api';
import { User } from '../types/types';

const AUTH_TOKEN_KEY = '@ballmate_auth_token';
const REFRESH_TOKEN_KEY = '@ballmate_refresh_token';
const USER_KEY = '@ballmate_user';
const SESSION_MODE_KEY = '@ballmate_session_mode';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isSessionOnly: boolean;
	login: (email: string, password: string) => Promise<void>;
	loginWithRememberMe: (email: string, password: string, rememberMe: boolean) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<boolean>;
	setUserData: (user: User) => Promise<void>;
	refreshProfile: () => Promise<User | null>;
	tryRefreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSessionOnly, setIsSessionOnly] = useState(false);

	const setUserAndPersist = async (nextUser: User | null, shouldPersist: boolean = true) => {
		setUser(nextUser);
		api.currentUser = nextUser;

		// Cập nhật Sentry user context để track error theo user
		if (nextUser) {
			Sentry.setUser({
				id: nextUser.id.toString(),
				email: nextUser.email,
				username: nextUser.fullName,
				// Extra data cho debug
				data: {
					role: nextUser.role,
					phoneNumber: nextUser.phoneNumber,
				}
			});
			if (shouldPersist && !isSessionOnly) {
				await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
			}
		} else {
			Sentry.setUser(null);
			await AsyncStorage.removeItem(USER_KEY);
		}
	};

	// Handle refresh token failure - show alert and logout
	const handleRefreshFailed = useCallback(() => {
		console.log('[AuthContext] Refresh token failed, showing alert');
		Alert.alert(
			'Phiên đăng nhập hết hạn',
			'Vui lòng đăng nhập lại để tiếp tục sử dụng ứng dụng.',
			[
				{
					text: 'Đăng nhập lại',
					onPress: async () => {
						await logout();
					},
				},
			],
			{ cancelable: false }
		);
	}, []);

	// Try to refresh the access token using refresh token
	const tryRefreshToken = async (): Promise<boolean> => {
		const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
		if (!storedRefreshToken || storedRefreshToken === 'undefined') {
			console.log('[AuthContext] No refresh token available');
			return false;
		}

		try {
			console.log('[AuthContext] Attempting to refresh token');
			api.setRefreshToken(storedRefreshToken);
			const response = await api.refreshAccessToken();

			// Save new tokens
			const newAccessToken = response.access_token;
			const newRefreshToken = response.refresh_token;

			api.setAccessToken(newAccessToken);
			if (newRefreshToken) {
				api.setRefreshToken(newRefreshToken);
				if (!isSessionOnly) {
					await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
				}
			}
			if (!isSessionOnly) {
				await AsyncStorage.setItem(AUTH_TOKEN_KEY, newAccessToken);
			}

			console.log('[AuthContext] Token refresh successful');
			return true;
		} catch (error) {
			console.error('[AuthContext] Token refresh failed:', error);
			return false;
		}
	};

	// Validate token by calling profile endpoint
	const validateToken = async (): Promise<boolean> => {
		try {
			console.log('[AuthContext] Validating token with backend');
			const userData = await api.getProfile();
			await setUserAndPersist(userData, !isSessionOnly);
			console.log('[AuthContext] Token validated successfully');
			return true;
		} catch (error: any) {
			console.log('[AuthContext] Token validation failed:', error?.response?.status);
			return false;
		}
	};

	// Load stored auth on app start
	useEffect(() => {
		loadStoredAuth();

		// Set up refresh failed callback
		api.setOnRefreshFailed(handleRefreshFailed);
	}, [handleRefreshFailed]);

	const loadStoredAuth = async () => {
		try {
			const [storedToken, storedRefreshToken, storedUser, storedSessionMode] = await Promise.all([
				AsyncStorage.getItem(AUTH_TOKEN_KEY),
				AsyncStorage.getItem(REFRESH_TOKEN_KEY),
				AsyncStorage.getItem(USER_KEY),
				AsyncStorage.getItem(SESSION_MODE_KEY),
			]);

			console.log('[AuthContext] Loading stored auth, token exists:', !!storedToken);

			// Check if previous session was session-only mode
			if (storedSessionMode === 'true') {
				// Session mode was active but app was closed, clear everything
				console.log('[AuthContext] Previous session was session-only, clearing tokens');
				await Promise.all([
					AsyncStorage.removeItem(AUTH_TOKEN_KEY),
					AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
					AsyncStorage.removeItem(USER_KEY),
					AsyncStorage.removeItem(SESSION_MODE_KEY),
				]);
				setIsLoading(false);
				return;
			}

			if (storedToken && storedToken !== 'undefined') {
				api.setAccessToken(storedToken);
				if (storedRefreshToken && storedRefreshToken !== 'undefined') {
					api.setRefreshToken(storedRefreshToken);
				}

				// Try to validate the token with backend
				const isValid = await validateToken();

				if (isValid) {
					// Token is valid, user is already set by validateToken
					console.log('[AuthContext] Token valid, user authenticated');
				} else {
					// Token invalid, try to refresh
					console.log('[AuthContext] Token invalid, attempting refresh');
					const refreshed = await tryRefreshToken();

					if (refreshed) {
						// Try validation again after refresh
						const isValidAfterRefresh = await validateToken();
						if (!isValidAfterRefresh) {
							// Even after refresh, validation failed - clear everything
							console.log('[AuthContext] Validation failed after refresh, clearing auth');
							await clearStoredAuth();
						}
					} else {
						// Refresh failed, clear everything
						console.log('[AuthContext] Refresh failed, clearing auth');
						await clearStoredAuth();
					}
				}
			}
		} catch (error) {
			console.error('Failed to load stored auth:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const clearStoredAuth = async () => {
		await Promise.all([
			AsyncStorage.removeItem(AUTH_TOKEN_KEY),
			AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
			AsyncStorage.removeItem(USER_KEY),
			AsyncStorage.removeItem(SESSION_MODE_KEY),
		]);
		api.logout();
		setUser(null);
	};

	// Legacy login (always persistent for backward compatibility)
	const login = async (email: string, password: string) => {
		await loginWithRememberMe(email, password, true);
	};

	// Login with remember me option
	const loginWithRememberMe = async (email: string, password: string, rememberMe: boolean) => {
		const response = await api.login(email, password);

		console.log('[AuthContext] Login response, access_token exists:', !!response.access_token);

		setIsSessionOnly(!rememberMe);

		if (rememberMe) {
			// Persistent mode: Store tokens and user data
			await Promise.all([
				AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token),
				AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token),
				AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user)),
				AsyncStorage.removeItem(SESSION_MODE_KEY), // Clear session mode flag
			]);
		} else {
			// Session-only mode: Mark as session mode but don't store tokens
			await AsyncStorage.setItem(SESSION_MODE_KEY, 'true');
			// Clear any previously stored tokens
			await Promise.all([
				AsyncStorage.removeItem(AUTH_TOKEN_KEY),
				AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
				AsyncStorage.removeItem(USER_KEY),
			]);
		}

		api.setAccessToken(response.access_token);
		api.setRefreshToken(response.refresh_token);
		await setUserAndPersist(response.user, rememberMe);
	};

	const logout = async () => {
		// Clear stored auth
		await Promise.all([
			AsyncStorage.removeItem(AUTH_TOKEN_KEY),
			AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
			AsyncStorage.removeItem(USER_KEY),
			AsyncStorage.removeItem(SESSION_MODE_KEY),
		]);

		// Clear API state
		api.logout();
		setUser(null);
		setIsSessionOnly(false);
	};

	const setUserData = async (nextUser: User) => {
		await setUserAndPersist(nextUser, !isSessionOnly);
	};

	const refreshProfile = async (): Promise<User | null> => {
		try {
			const fresh = await api.getProfile();
			await setUserAndPersist(fresh, !isSessionOnly);
			return fresh;
		} catch {
			return null;
		}
	};

	const checkAuth = async (): Promise<boolean> => {
		try {
			const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
			return !!storedToken && storedToken !== 'undefined';
		} catch {
			return false;
		}
	};

	const value: AuthContextType = {
		user,
		isAuthenticated: !!user || api.isAuthenticated,
		isLoading,
		isSessionOnly,
		login,
		loginWithRememberMe,
		logout,
		checkAuth,
		setUserData,
		refreshProfile,
		tryRefreshToken,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

export default AuthContext;

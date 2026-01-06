import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { User } from '../types/types';

const AUTH_TOKEN_KEY = '@ballmate_auth_token';
const REFRESH_TOKEN_KEY = '@ballmate_refresh_token';
const USER_KEY = '@ballmate_user';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	checkAuth: () => Promise<boolean>;
	setUserData: (user: User) => Promise<void>;
	refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const setUserAndPersist = async (nextUser: User | null) => {
		setUser(nextUser);
		api.currentUser = nextUser;
		if (nextUser) {
			await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
		} else {
			await AsyncStorage.removeItem(USER_KEY);
		}
	};

	// Load stored auth on app start
	useEffect(() => {
		loadStoredAuth();
	}, []);

	const loadStoredAuth = async () => {
		try {
			const [storedToken, storedRefreshToken, storedUser] = await Promise.all([
				AsyncStorage.getItem(AUTH_TOKEN_KEY),
				AsyncStorage.getItem(REFRESH_TOKEN_KEY),
				AsyncStorage.getItem(USER_KEY),
			]);

			console.log('[AuthContext] Loading stored auth, token exists:', !!storedToken);

			if (storedToken && storedToken !== 'undefined') {
				api.setAccessToken(storedToken);
				if (storedRefreshToken && storedRefreshToken !== 'undefined') {
					api.setRefreshToken(storedRefreshToken);
				}
				if (storedUser) {
					const userData = JSON.parse(storedUser);
					setUser(userData);
					api.currentUser = userData;
				} else {
					// Token exists but user not stored (or was cleared). Fetch profile to restore.
					try {
						const fresh = await api.getProfile();
						await setUserAndPersist(fresh);
					} catch {
						// Ignore: token may be invalid/expired; user stays null.
					}
				}
			}
		} catch (error) {
			console.error('Failed to load stored auth:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (email: string, password: string) => {
		const response = await api.login(email, password);

		console.log('[AuthContext] Login response, access_token exists:', !!response.access_token);

		// Store tokens and user data (using snake_case from backend)
		await Promise.all([
			AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token),
			AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token),
			AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user)),
		]);

		api.setAccessToken(response.access_token);
		api.setRefreshToken(response.refresh_token);
		await setUserAndPersist(response.user);
	};

	const logout = async () => {
		// Clear stored auth
		await Promise.all([
			AsyncStorage.removeItem(AUTH_TOKEN_KEY),
			AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
			AsyncStorage.removeItem(USER_KEY),
		]);

		// Clear API state
		api.logout();
		setUser(null);
	};

	const setUserData = async (nextUser: User) => {
		await setUserAndPersist(nextUser);
	};

	const refreshProfile = async (): Promise<User | null> => {
		try {
			const fresh = await api.getProfile();
			await setUserAndPersist(fresh);
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
		login,
		logout,
		checkAuth,
		setUserData,
		refreshProfile,
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

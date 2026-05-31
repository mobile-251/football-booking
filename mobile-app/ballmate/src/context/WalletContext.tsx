import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

type WalletContextValue = {
	balance: number | null;
	loading: boolean;
	refreshWallet: (silent?: boolean) => Promise<number | null>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [balance, setBalance] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);

	const refreshWallet = useCallback(async (silent = false) => {
		if (!api.currentUser) {
			setBalance(null);
			return null;
		}
		try {
			if (!silent) setLoading(true);
			const w = await api.getWalletMe();
			setBalance(w.balance);
			return w.balance;
		} catch (e) {
			console.error('[Wallet] refresh failed', e);
			return null;
		} finally {
			if (!silent) setLoading(false);
		}
	}, []);

	useRefreshOnFocus(
		() => refreshWallet(true),
		isAuthenticated && !authLoading,
	);

	useEffect(() => {
		if (isAuthenticated && !authLoading) {
			void refreshWallet(true);
		} else if (!authLoading && !isAuthenticated) {
			setBalance(null);
		}
	}, [isAuthenticated, authLoading, refreshWallet]);

	return (
		<WalletContext.Provider value={{ balance, loading, refreshWallet }}>
			{children}
		</WalletContext.Provider>
	);
}

export function useWallet(): WalletContextValue {
	const ctx = useContext(WalletContext);
	if (!ctx) {
		throw new Error('useWallet must be used within WalletProvider');
	}
	return ctx;
}

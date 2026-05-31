import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Gọi lại khi màn hình được focus (kể cả khi quay lại từ tab/stack khác). */
export function useRefreshOnFocus(onRefresh: () => void | Promise<void>, enabled = true) {
	const onRefreshRef = useRef(onRefresh);
	onRefreshRef.current = onRefresh;

	useFocusEffect(
		useCallback(() => {
			if (!enabled) return;
			void onRefreshRef.current();
		}, [enabled]),
	);
}

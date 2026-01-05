export const theme = {
	colors: {
		primary: '#1F6650',
		primaryDark: '#0f5132',
		primaryLight: '#297558',

		secondary: '#6F9A8D',
		secondaryDark: '#4f7a6a',

		accent: '#EA5E5E',
		accentDark: '#dc2626',

		background: '#EAFBEA',
		backgroundLight: '#f0fdf0',

		foreground: '#0f261c',
		foregroundMuted: '#6F9A8D',

		card: 'rgba(255, 255, 255, 0.95)',
		cardSolid: '#FFFFFF',

		border: 'rgba(111, 154, 141, 0.2)',
		borderSolid: '#d1e7dd',

		input: 'rgba(255, 255, 255, 0.95)',

		success: '#22c55e',
		warning: '#f59e0b',
		error: '#EA5E5E',
		info: '#3b82f6',

		white: '#FFFFFF',
		black: '#000000',
	},

	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 20,
		xxl: 24,
		xxxl: 32,
	},

	borderRadius: {
		sm: 8,
		md: 12,
		lg: 16,
		xl: 20,
		full: 9999,
	},

	typography: {
		fontFamily: {
			regular: 'System',
			medium: 'System',
			semiBold: 'System',
			bold: 'System',
		},
		fontSize: {
			xs: 12,
			sm: 14,
			base: 16,
			lg: 18,
			xl: 20,
			'2xl': 24,
			'3xl': 30,
		},
		fontWeight: {
			regular: '400' as const,
			medium: '500' as const,
			semiBold: '600' as const,
			bold: '700' as const,
		},
	},

	shadows: {
		soft: {
			shadowColor: '#1F6650',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.08,
			shadowRadius: 8,
			elevation: 2,
		},
		medium: {
			shadowColor: '#1F6650',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.12,
			shadowRadius: 16,
			elevation: 4,
		},
		strong: {
			shadowColor: '#1F6650',
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: 0.16,
			shadowRadius: 24,
			elevation: 8,
		},
	},
};

export type Theme = typeof theme;

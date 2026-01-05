import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'ballmate',
    slug: 'ballmate-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'ballmate',
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.ballmate.app',
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: 'com.ballmate.app',
    },
    web: {
        favicon: './assets/favicon.png',
    },
    extra: {
        ...config.extra,
        // Runtime config - loaded from EAS Environment Variables
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
        // Build config - set in eas.json
        appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
        eas: {
            projectId: 'a2ff0a88-40cf-43b6-b9ff-12c29d45c463',
        },
    },
    owner: 'ballmate-mobile',
    runtimeVersion: {
        policy: 'appVersion',
    },
    updates: {
        url: 'https://u.expo.dev/a2ff0a88-40cf-43b6-b9ff-12c29d45c463',
    },
});

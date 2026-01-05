import Constants from 'expo-constants';

/**
 * Application configuration loaded from expo config extra.
 * 
 * Configuration Strategy:
 * - Build config (EXPO_PUBLIC_APP_ENV): Set in eas.json
 * - Runtime config (EXPO_PUBLIC_API_URL): Set via EAS Environment Variables
 * 
 * To set EAS Environment Variables:
 *   npx eas env:set EXPO_PUBLIC_API_URL http://localhost:3001 --environment development
 *   npx eas env:set EXPO_PUBLIC_API_URL https://staging-api.ballmate.com --environment preview
 *   npx eas env:set EXPO_PUBLIC_API_URL https://api.ballmate.com --environment production
 */
interface AppConfig {
    apiUrl: string;
    appEnv: string;
}

const extra = Constants.expoConfig?.extra as AppConfig | undefined;

/**
 * Application configuration object.
 * Access environment-specific values through this object.
 */
export const Config = {
    /**
     * Base URL for API requests.
     * Set via EXPO_PUBLIC_API_URL environment variable in EAS.
     * Fallback to localhost for local development.
     */
    API_URL: extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',

    /**
     * Current application environment.
     * Values: 'development' | 'preview' | 'production'
     * Set in eas.json as build config.
     */
    APP_ENV: extra?.appEnv || 'development',

    /**
     * Whether the app is running in production mode.
     */
    IS_PRODUCTION: extra?.appEnv === 'production',

    /**
     * Whether the app is running in development mode.
     */
    IS_DEVELOPMENT: extra?.appEnv === 'development' || !extra?.appEnv,

    /**
     * Whether the app is running in preview/staging mode.
     */
    IS_PREVIEW: extra?.appEnv === 'preview',
} as const;

export default Config;

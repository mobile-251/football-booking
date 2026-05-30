export default () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT ?? '3001', 10),

    database: {
        url: process.env.DATABASE_URL,
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    },

    cors: {
        origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    },

    sepay: {
        merchantId:
            process.env.MERCHANT_ID || process.env.SEPAY_MERCHANT_ID || '',
        secretKey:
            process.env.MERCHANT_SECRET_KEY ||
            process.env.SEPAY_SECRET_KEY ||
            '',
        webhookApiKey:
            process.env.SEPAY_WEBHOOK_API_KEY ||
            process.env.SEPAY_WEBHOOK_SECRET ||
            '',
        accountNumber:
            process.env.SEPAY_ACCOUNT_NUMBER || '',
        bankName: process.env.SEPAY_BANK_NAME || 'MSB',
        paymentCodePrefix:
            process.env.SEPAY_PAYMENT_CODE_PREFIX || 'BM',
        env: process.env.SEPAY_ENV || 'sandbox',
        paymentTtlMinutes: parseInt(
            process.env.SEPAY_PAYMENT_TTL_MINUTES ?? '15',
            10,
        ),
        appPublicUrl: process.env.APP_PUBLIC_URL || 'http://localhost:3001',
        userApiToken:
            process.env.SEPAY_USER_API_TOKEN ||
            process.env.SEPAY_API_TOKEN ||
            '',
    },
});

// Type definitions for configuration
export interface AppConfiguration {
    nodeEnv: string;
    port: number;
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string;
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
    };
    cors: {
        origins: string[];
    };
    sepay: {
        merchantId: string;
        secretKey: string;
        webhookApiKey: string;
        accountNumber: string;
        bankName: string;
        paymentCodePrefix: string;
        env: string;
        paymentTtlMinutes: number;
        appPublicUrl: string;
        userApiToken: string;
    };
}

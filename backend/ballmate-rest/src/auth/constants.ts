export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  accessTokenExpiry: '15m' as const,
  refreshTokenExpiry: '7d' as const,
};

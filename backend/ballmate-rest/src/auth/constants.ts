// JWT constants are now managed via ConfigService in configuration.ts
// This file is kept for backward compatibility reference only
// All JWT configuration should be accessed via ConfigService:
//   - configService.get<string>('jwt.secret')
//   - configService.get<string>('jwt.accessTokenExpiry')
//   - configService.get<string>('jwt.refreshTokenExpiry')

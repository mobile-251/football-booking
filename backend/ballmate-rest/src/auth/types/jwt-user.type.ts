import { UserRole } from '@prisma/client';

export interface JwtUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  playerId?: number;
  ownerId?: number;
  venueManagerId?: number;
  venueId?: number;
}

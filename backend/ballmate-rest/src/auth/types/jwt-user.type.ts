export interface JwtUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  playerId?: number;
  ownerId?: number;
}

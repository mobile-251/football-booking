export type UserRole = 'ADMIN' | 'FIELD_OWNER' | 'VENUE_MANAGER' | 'PLAYER';

export interface VenueSummary {
  id: number;
  name: string;
  address: string;
  city?: string;
  district?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword?: boolean;
  fieldOwnerId?: number;
  venueId?: number;
  venueName?: string;
  venues?: VenueSummary[];
  player?: { id: number; userId: number } | null;
}

const PORTAL_ROLES: UserRole[] = ['FIELD_OWNER', 'VENUE_MANAGER', 'ADMIN'];

export function isPortalUser(user: AuthUser | null | undefined): boolean {
  return !!user && PORTAL_ROLES.includes(user.role);
}

export function isOwner(user: AuthUser | null | undefined): boolean {
  return user?.role === 'FIELD_OWNER';
}

export function isManager(user: AuthUser | null | undefined): boolean {
  return user?.role === 'VENUE_MANAGER';
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'FIELD_OWNER':
      return 'Chủ sân';
    case 'VENUE_MANAGER':
      return 'Quản lý sân';
    case 'ADMIN':
      return 'Quản trị';
    default:
      return 'Người dùng';
  }
}

export function normalizeLoginUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: raw.id as number,
    email: raw.email as string,
    fullName: raw.fullName as string,
    role: raw.role as UserRole,
    mustChangePassword: Boolean(raw.mustChangePassword),
    fieldOwnerId: raw.fieldOwnerId as number | undefined,
    venueId: raw.venueId as number | undefined,
    venueName: raw.venueName as string | undefined,
    venues: (raw.venues as VenueSummary[]) ?? [],
    player: raw.player as AuthUser['player'],
  };
}

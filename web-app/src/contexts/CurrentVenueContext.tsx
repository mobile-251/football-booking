import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import venueApi from '../api/venueApi';
import type { AuthUser, VenueSummary } from '../types/auth';
import { getStoredUser, isManager, isOwner } from '../types/auth';

const STORAGE_KEY = 'currentVenueId';

export interface CurrentVenueContextValue {
  venues: VenueSummary[];
  currentVenueId: number | null;
  currentVenue: VenueSummary | null;
  isLoading: boolean;
  user: AuthUser | null;
  setCurrentVenueId: (id: number) => void;
  refreshVenues: () => Promise<void>;
}

const CurrentVenueContext = createContext<CurrentVenueContextValue | null>(null);

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [currentVenueId, setCurrentVenueIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentVenueId = useCallback((id: number) => {
    setCurrentVenueIdState(id);
    if (user && isOwner(user)) {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, [user]);

  const bootstrapFromUser = useCallback((authUser: AuthUser) => {
    if (isManager(authUser) && authUser.venueId) {
      const list = authUser.venues?.length
        ? authUser.venues
        : [
            {
              id: authUser.venueId,
              name: authUser.venueName || 'Sân của bạn',
              address: '',
            },
          ];
      setVenues(list);
      setCurrentVenueIdState(authUser.venueId);
      setIsLoading(false);
      return;
    }

    if (isOwner(authUser) && authUser.venues?.length) {
      setVenues(authUser.venues);
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedId = stored ? Number(stored) : null;
      const validStored =
        storedId && authUser.venues.some((v) => v.id === storedId);
      setCurrentVenueIdState(
        validStored ? storedId : authUser.venues[0].id,
      );
      if (!validStored && authUser.venues[0]) {
        localStorage.setItem(STORAGE_KEY, String(authUser.venues[0].id));
      }
      setIsLoading(false);
    }
  }, []);

  const refreshVenues = useCallback(async () => {
    const authUser = getStoredUser();
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res: unknown = await venueApi.getMyVenues();
      const list = Array.isArray(res) ? (res as VenueSummary[]) : [];
      setVenues(list);

      if (isManager(authUser) && list[0]) {
        setCurrentVenueIdState(list[0].id);
      } else if (isOwner(authUser)) {
        if (list.length === 0) {
          setCurrentVenueIdState(null);
          localStorage.removeItem(STORAGE_KEY);
        } else {
          const stored = localStorage.getItem(STORAGE_KEY);
          const storedId = stored ? Number(stored) : null;
          const valid =
            storedId && list.some((v) => v.id === storedId);
          const nextId = valid ? storedId! : list[0].id;
          setCurrentVenueIdState(nextId);
          localStorage.setItem(STORAGE_KEY, String(nextId));
        }
      }
    } catch {
      bootstrapFromUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }, [bootstrapFromUser]);

  useEffect(() => {
    const authUser = getStoredUser();
    if (!authUser) {
      setIsLoading(false);
      return;
    }
    refreshVenues();
  }, [refreshVenues]);

  const currentVenue = useMemo(
    () => venues.find((v) => v.id === currentVenueId) ?? null,
    [venues, currentVenueId],
  );

  const value = useMemo(
    () => ({
      venues,
      currentVenueId,
      currentVenue,
      isLoading,
      user,
      setCurrentVenueId,
      refreshVenues,
    }),
    [
      venues,
      currentVenueId,
      currentVenue,
      isLoading,
      user,
      setCurrentVenueId,
      refreshVenues,
    ],
  );

  return (
    <CurrentVenueContext.Provider value={value}>
      {children}
    </CurrentVenueContext.Provider>
  );
}

export function useCurrentVenue(): CurrentVenueContextValue {
  const ctx = useContext(CurrentVenueContext);
  if (!ctx) {
    throw new Error('useCurrentVenue must be used within VenueProvider');
  }
  return ctx;
}

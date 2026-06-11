'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AdminProfile } from '@/types/adminAuth';
import {
  canAccess,
  clearAdminSession,
  getAdminProfile,
  getStoredAdmin,
  getStoredToken,
  redirectToSignIn,
} from '@/lib/adminAuth';
import { subscribeAdminDemoMode } from '@/lib/adminDemoMode';
import { getAdminDisplayName, getAdminInitials } from '@/utils/adminDisplay';
import { isPublicAdminRoute } from '@/utils/adminPublicRoutes';

type AdminAuthContextValue = {
  admin: AdminProfile | null;
  displayName: string;
  initials: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  canAccess: (permissionKey: string) => boolean;
  refreshProfile: () => Promise<AdminProfile | null>;
  logout: () => void;
  setAdmin: (profile: AdminProfile | null) => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => subscribeAdminDemoMode(setDemoMode), []);

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setAdmin(null);
      return null;
    }

    try {
      const profile = await getAdminProfile();
      setAdmin(profile);
      return profile;
    } catch {
      clearAdminSession();
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const cached = getStoredAdmin();
      if (cached) setAdmin(cached);

      const token = getStoredToken();
      const onPublicRoute =
        typeof window !== 'undefined' && isPublicAdminRoute(window.location.pathname);

      if (!token) {
        if (!cancelled) {
          setAdmin(null);
          setIsLoading(false);
        }
        return;
      }

      // Never block sign-in / setup / reset-password while validating an existing session.
      if (onPublicRoute && !cancelled) {
        setIsLoading(false);
      }

      try {
        const profile = await getAdminProfile();
        if (!cancelled) setAdmin(profile);
      } catch {
        clearAdminSession();
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled && !onPublicRoute) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
    redirectToSignIn();
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin,
      displayName: getAdminDisplayName(admin),
      initials: getAdminInitials(admin),
      isAuthenticated: !!admin && !!getStoredToken(),
      isLoading,
      canAccess: (permissionKey: string) =>
        demoMode ? true : canAccess(admin, permissionKey),
      refreshProfile,
      logout,
      setAdmin,
    }),
    [admin, demoMode, isLoading, refreshProfile, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}

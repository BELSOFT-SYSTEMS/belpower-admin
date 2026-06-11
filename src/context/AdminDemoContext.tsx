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
import {
  getAdminDemoMode,
  isSuperAdminProfile,
  setAdminDemoMode,
  startAdminDemoModePolling,
  stopAdminDemoModePolling,
  subscribeAdminDemoMode,
  syncAdminDemoMode,
} from '@/lib/adminDemoMode';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { usePathname } from 'next/navigation';
import { isPublicAdminRoute } from '@/utils/adminPublicRoutes';

type AdminDemoContextValue = {
  enabled: boolean;
  isUpdating: boolean;
  canToggle: boolean;
  setEnabled: (next: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const AdminDemoContext = createContext<AdminDemoContextValue | null>(null);

export function AdminDemoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin, isAuthenticated } = useAdminAuth();
  const [enabled, setEnabledState] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const canToggle = isSuperAdminProfile(admin);
  const onPublicRoute = isPublicAdminRoute(pathname);

  useEffect(() => {
    if (!isAuthenticated || onPublicRoute) return;

    startAdminDemoModePolling();
    const unsubscribe = subscribeAdminDemoMode(setEnabledState);

    return () => {
      unsubscribe();
      stopAdminDemoModePolling();
    };
  }, [isAuthenticated, onPublicRoute]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (!canToggle) return;
      setIsUpdating(true);
      try {
        await setAdminDemoMode(next);
        window.location.reload();
      } finally {
        setIsUpdating(false);
      }
    },
    [canToggle]
  );

  const refresh = useCallback(async () => {
    await syncAdminDemoMode();
  }, []);

  const value = useMemo<AdminDemoContextValue>(
    () => ({
      enabled,
      isUpdating,
      canToggle,
      setEnabled,
      refresh,
    }),
    [enabled, isUpdating, canToggle, setEnabled, refresh]
  );

  return <AdminDemoContext.Provider value={value}>{children}</AdminDemoContext.Provider>;
}

export function useAdminDemo(): AdminDemoContextValue {
  const context = useContext(AdminDemoContext);
  if (!context) {
    throw new Error('useAdminDemo must be used within AdminDemoProvider');
  }
  return context;
}

export function useIsAdminDemoMode(): boolean {
  const context = useContext(AdminDemoContext);
  return context?.enabled ?? getAdminDemoMode();
}

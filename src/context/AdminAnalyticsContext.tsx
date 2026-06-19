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
import { useAdminAuth } from '@/context/AdminAuthContext';
import { isSuperAdminActor } from '@/utils/adminInternalTestAccess';
import {
  ADMIN_ANALYTICS_PREFERENCE_EVENT,
  getExcludeInternalTestPreference,
  setExcludeInternalTestPreference,
} from '@/utils/adminAnalyticsPreference';

type AdminAnalyticsContextValue = {
  excludeInternalTest: boolean;
  canToggleInternalTestExclusion: boolean;
  setExcludeInternalTest: (exclude: boolean) => void;
  toggleExcludeInternalTest: () => void;
  refreshKey: number;
};

const AdminAnalyticsContext = createContext<AdminAnalyticsContextValue | null>(null);

export function AdminAnalyticsProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdminAuth();
  const canToggle = isSuperAdminActor(admin);
  const [excludeInternalTest, setExcludeInternalTestState] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setExcludeInternalTestState(getExcludeInternalTestPreference());
  }, []);

  useEffect(() => {
    const handlePreferenceChange = () => {
      setExcludeInternalTestState(getExcludeInternalTestPreference());
      setRefreshKey((value) => value + 1);
    };

    window.addEventListener(ADMIN_ANALYTICS_PREFERENCE_EVENT, handlePreferenceChange);
    return () => {
      window.removeEventListener(ADMIN_ANALYTICS_PREFERENCE_EVENT, handlePreferenceChange);
    };
  }, []);

  const setExcludeInternalTest = useCallback((exclude: boolean) => {
    setExcludeInternalTestPreference(exclude);
    setExcludeInternalTestState(exclude);
    setRefreshKey((value) => value + 1);
  }, []);

  const toggleExcludeInternalTest = useCallback(() => {
    setExcludeInternalTest(!getExcludeInternalTestPreference());
  }, [setExcludeInternalTest]);

  const value = useMemo<AdminAnalyticsContextValue>(
    () => ({
      excludeInternalTest,
      canToggleInternalTestExclusion: canToggle,
      setExcludeInternalTest,
      toggleExcludeInternalTest,
      refreshKey,
    }),
    [excludeInternalTest, canToggle, setExcludeInternalTest, toggleExcludeInternalTest, refreshKey]
  );

  return (
    <AdminAnalyticsContext.Provider value={value}>{children}</AdminAnalyticsContext.Provider>
  );
}

export function useAdminAnalytics(): AdminAnalyticsContextValue {
  const context = useContext(AdminAnalyticsContext);
  if (!context) {
    throw new Error('useAdminAnalytics must be used within AdminAnalyticsProvider');
  }
  return context;
}

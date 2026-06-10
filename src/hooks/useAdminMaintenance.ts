'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  buildMaintenancePatch,
  getMaintenanceState,
  maintenanceStateToFlags,
  patchMaintenanceState,
} from '@/lib/adminMaintenance';
import type { MaintenanceToggleKey } from '@/types/adminMaintenance';

export function useAdminMaintenance(enabled: boolean) {
  const [flags, setFlags] = useState<Record<MaintenanceToggleKey, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [updatingKey, setUpdatingKey] = useState<MaintenanceToggleKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    if (!enabled) {
      setFlags(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await getMaintenanceState();
      setFlags(maintenanceStateToFlags(state));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maintenance settings');
      setFlags(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const updateToggle = useCallback(
    async (key: MaintenanceToggleKey, enabled: boolean) => {
      if (flags && flags[key] === enabled) return flags;

      const previous = flags;
      setUpdatingKey(key);
      setError(null);
      setFlags((current) => (current ? { ...current, [key]: enabled } : current));

      try {
        const state = await patchMaintenanceState(buildMaintenancePatch(key, enabled));
        const nextFlags = maintenanceStateToFlags(state);
        setFlags(nextFlags);
        return nextFlags;
      } catch (err) {
        if (previous) setFlags(previous);
        const message =
          err instanceof Error ? err.message : 'Failed to update maintenance settings';
        setError(message);
        throw err;
      } finally {
        setUpdatingKey(null);
      }
    },
    [flags]
  );

  return {
    flags,
    isLoading,
    updatingKey,
    error,
    updateToggle,
    reload: loadState,
  };
}

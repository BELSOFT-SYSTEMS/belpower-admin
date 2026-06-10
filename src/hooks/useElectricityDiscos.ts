'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fallbackElectricityDiscos,
  fetchElectricityDiscos,
  toDiscoDropdownOptions,
} from '@/lib/electricityDiscos';
import type { ElectricityDisco } from '@/types/electricityDiscos';

type UseElectricityDiscosResult = {
  discos: ElectricityDisco[];
  dropdownOptions: { value: string; label: string }[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useElectricityDiscos(
  placeholder = 'Select disco'
): UseElectricityDiscosResult {
  const [discos, setDiscos] = useState<ElectricityDisco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextDiscos = await fetchElectricityDiscos();
      setDiscos(nextDiscos);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load electricity discos';
      setError(message);
      setDiscos(fallbackElectricityDiscos());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dropdownOptions = useMemo(
    () => toDiscoDropdownOptions(discos, placeholder),
    [discos, placeholder]
  );

  return { discos, dropdownOptions, isLoading, error, refresh };
}

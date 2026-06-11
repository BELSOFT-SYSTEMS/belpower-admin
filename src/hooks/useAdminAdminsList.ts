'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMockAdminsList } from '@/data/adminDemoMocks';
import { AuthApiError } from '@/lib/adminAuth';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getAdminsList, type AdminsListParams } from '@/lib/adminAdmins';
import type { AdminAccount } from '@/types/adminManagement';

export function useAdminAdminsList(params: AdminsListParams = {}) {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      if (getAdminDemoMode()) {
        const result = getMockAdminsList(params);
        setAdmins(result.admins);
        setTotal(result.total);
        return;
      }

      const result = await getAdminsList(params);
      setAdmins(result.admins);
      setTotal(result.total);
    } catch (err) {
      setAdmins([]);
      setTotal(0);
      if (err instanceof AuthApiError) {
        setError(err.message);
        setErrorCode(err.code ?? null);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load admins');
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.limit, params.search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { admins, total, isLoading, error, errorCode, refresh };
}

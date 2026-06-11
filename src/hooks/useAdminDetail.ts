'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMockAdminActivityLogs, getMockAdminDetail } from '@/data/adminDemoMocks';
import { AuthApiError } from '@/lib/adminAuth';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getAdminActivityLogs, getAdminDetail } from '@/lib/adminAdmins';
import type { AdminAccount, AdminLog } from '@/types/adminManagement';

export function useAdminDetail(adminId: string) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!adminId) {
      setAdmin(null);
      setLogs([]);
      setError('Admin not found');
      setErrorCode('NOT_FOUND');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      if (getAdminDemoMode()) {
        const detail = getMockAdminDetail(adminId);
        if (!detail) {
          setAdmin(null);
          setLogs([]);
          setError('Admin not found');
          setErrorCode('NOT_FOUND');
          return;
        }
        setAdmin(detail);
        setLogs(getMockAdminActivityLogs(adminId).logs);
        return;
      }

      const [detail, activity] = await Promise.all([
        getAdminDetail(adminId),
        getAdminActivityLogs({ adminId, limit: 100 }),
      ]);
      setAdmin(detail);
      setLogs(activity.logs);
    } catch (err) {
      setAdmin(null);
      setLogs([]);
      if (err instanceof AuthApiError) {
        setError(err.message);
        setErrorCode(err.code ?? null);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load admin');
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { admin, logs, isLoading, error, errorCode, refresh };
}

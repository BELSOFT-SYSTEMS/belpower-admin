'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMockUserDetail } from '@/data/adminDetailMocks';
import { AuthApiError } from '@/lib/adminAuth';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { getUserDetail } from '@/lib/adminUsers';
import type { AdminUserDetail } from '@/types/adminUserDetail';

export function useAdminUserDetail(userId: string) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setDetail(null);
      setError('User not found');
      setErrorCode('NOT_FOUND');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      if (getAdminDemoMode()) {
        const mock = getMockUserDetail(userId);
        if (!mock) {
          setDetail(null);
          setError('User not found');
          setErrorCode('NOT_FOUND');
          return;
        }
        setDetail(mock);
        return;
      }

      const result = await getUserDetail(userId);
      setDetail(result);
    } catch (err) {
      setDetail(null);
      if (err instanceof AuthApiError) {
        setError(err.message);
        setErrorCode(err.code ?? null);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load user');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { detail, isLoading, error, errorCode, refresh };
}

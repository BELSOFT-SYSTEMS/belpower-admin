'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthApiError } from '@/lib/adminAuth';
import { getTransactionDetail } from '@/lib/adminTransactions';
import type { TransactionDetailData } from '@/types/adminTransactions';

export function useAdminTransactionDetail(transactionId: string) {
  const [detail, setDetail] = useState<TransactionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!transactionId) {
      setDetail(null);
      setError('Transaction not found');
      setErrorCode('NOT_FOUND');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const result = await getTransactionDetail(transactionId);
      setDetail(result);
    } catch (err) {
      setDetail(null);
      if (err instanceof AuthApiError) {
        setError(err.message);
        setErrorCode(err.code ?? null);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load transaction');
      }
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { detail, isLoading, error, errorCode, refresh };
}

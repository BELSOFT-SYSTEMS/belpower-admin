'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { blockTransaction, unblockTransaction } from '@/lib/adminTransactions';
import type { AdminTransaction } from '@/data/adminMockData';

export function useAdminTransactionsListActions(refresh: () => Promise<void>) {
  const router = useRouter();
  const [actingTxnId, setActingTxnId] = useState<string | null>(null);

  const handleReview = (tx: AdminTransaction) => {
    router.push(`/command-center/transactions/${tx.id}?tab=fraud`);
  };

  const handleBlock = async (tx: AdminTransaction) => {
    setActingTxnId(tx.id);
    try {
      await blockTransaction(tx.id);
      toast.success(`Transaction ${tx.reference} blocked.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to block transaction.');
    } finally {
      setActingTxnId(null);
    }
  };

  const handleUnblock = async (tx: AdminTransaction) => {
    setActingTxnId(tx.id);
    try {
      await unblockTransaction(tx.id);
      toast.success(`Transaction ${tx.reference} unblocked.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unblock transaction.');
    } finally {
      setActingTxnId(null);
    }
  };

  return {
    actingTxnId,
    handleReview,
    handleBlock,
    handleUnblock,
  };
}

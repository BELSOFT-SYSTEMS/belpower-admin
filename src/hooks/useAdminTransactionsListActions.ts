'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { blockTransaction, clearTransactionReview, unblockTransaction } from '@/lib/adminTransactions';
import type { AdminTransaction } from '@/data/adminMockData';
import type { AdminReturnContext } from '@/utils/adminReturnNavigation';
import { withAdminReturn } from '@/utils/adminReturnNavigation';

export function useAdminTransactionsListActions(
  refresh: () => Promise<void>,
  onActionComplete?: () => void | Promise<void>,
  detailReturnContext?: AdminReturnContext,
) {
  const router = useRouter();
  const [actingTxnId, setActingTxnId] = useState<string | null>(null);

  const handleReview = (tx: AdminTransaction) => {
    const path = `/command-center/transactions/${tx.id}?tab=fraud`;
    router.push(detailReturnContext ? withAdminReturn(path, detailReturnContext) : path);
  };

  const runAction = async (action: () => Promise<void>) => {
    await action();
    await onActionComplete?.();
  };

  const handleBlock = async (tx: AdminTransaction) => {
    setActingTxnId(tx.id);
    try {
      if (getAdminDemoMode()) {
        toast.success(`Demo: transaction ${tx.reference} blocked.`);
        await runAction(refresh);
        return;
      }
      await blockTransaction(tx.id);
      toast.success(`Transaction ${tx.reference} blocked.`);
      await runAction(refresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to block transaction.');
    } finally {
      setActingTxnId(null);
    }
  };

  const handleUnblock = async (tx: AdminTransaction) => {
    setActingTxnId(tx.id);
    try {
      if (getAdminDemoMode()) {
        toast.success(`Demo: transaction ${tx.reference} unblocked.`);
        await runAction(refresh);
        return;
      }
      await unblockTransaction(tx.id);
      toast.success(`Transaction ${tx.reference} unblocked.`);
      await runAction(refresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unblock transaction.');
    } finally {
      setActingTxnId(null);
    }
  };

  const handleClearReview = async (tx: AdminTransaction) => {
    setActingTxnId(tx.id);
    try {
      if (getAdminDemoMode()) {
        toast.success(`Demo: review cleared for ${tx.reference}.`);
        await runAction(refresh);
        return;
      }
      await clearTransactionReview(tx.id);
      toast.success(`Review cleared for ${tx.reference}.`);
      await runAction(refresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear review.');
    } finally {
      setActingTxnId(null);
    }
  };

  return {
    actingTxnId,
    handleReview,
    handleBlock,
    handleUnblock,
    handleClearReview,
  };
}

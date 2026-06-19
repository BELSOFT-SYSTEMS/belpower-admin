'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminTransactions.css';
import '@/styles/adminShared.css';
import { AdminTransactionsListView } from '@/components/admin/transactions/AdminTransactionsListView';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import type { AdminBulkAction } from '@/components/admin/ui/AdminBulkSelectToolbar';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import { TRANSACTION_FILTER_ALL } from '@/constants/adminTransactionFilters';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminTransactionsList } from '@/hooks/useAdminTransactionsList';
import { useAdminTransactionsListActions } from '@/hooks/useAdminTransactionsListActions';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import {
  blockTransaction,
  clearTransactionReview,
  unblockTransaction,
} from '@/lib/adminTransactions';
import { buildTransactionPageStatCards } from '@/utils/buildTransactionPageStatCards';
import {
  canViewTransactionMoneyStats,
  getTransactionStatCardCount,
} from '@/utils/adminTransactionStatsAccess';
import {
  buildTransactionsListReturn,
  getAdminReturnFromSearchParams,
} from '@/utils/adminReturnNavigation';
export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAccess, admin } = useAdminAuth();
  const userIdFilter = searchParams.get('userId') ?? undefined;
  const statusParam = searchParams.get('status');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(TRANSACTION_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(
    statusParam === 'pending' ? 'pending' : TRANSACTION_FILTER_ALL
  );
  const [page, setPage] = useState(1);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (statusParam === 'pending') {
      setStatusFilter('pending');
      return;
    }
    if (!statusParam) {
      setStatusFilter(TRANSACTION_FILTER_ALL);
    }
  }, [statusParam]);

  const {
    transactions,
    quickActions,
    stats,
    filters,
    pagination,
    isLoading,
    error,
    refresh,
    canViewInternalTestTransactions,
    canViewMoneyStats,
  } = useAdminTransactionsList({
    search: searchTerm,
    typeFilter: categoryFilter,
    statusFilter,
    page,
    userId: userIdFilter,
  });

  const transactionsListReturn = useMemo(() => {
    const inheritedReturn = getAdminReturnFromSearchParams(searchParams, {
      href: '',
      label: '',
    });
    if (inheritedReturn.href) return inheritedReturn;

    const params = new URLSearchParams();
    if (userIdFilter) params.set('userId', userIdFilter);
    if (statusParam) params.set('status', statusParam);
    return buildTransactionsListReturn(params.toString() || undefined);
  }, [searchParams, userIdFilter, statusParam]);

  const { actingTxnId, handleReview, handleBlock, handleUnblock, handleClearReview } =
    useAdminTransactionsListActions(refresh, undefined, transactionsListReturn);

  const transactionIds = useMemo(() => transactions.map((tx) => tx.id), [transactions]);

  const {
    selectionMode,
    selectedIds,
    selectedCount,
    toggleSelectionMode,
    toggleItem,
    isSelected,
    exitSelectionMode,
  } = useBulkSelection(transactionIds);

  const runBulkTransactionAction = async (
    label: string,
    action: (id: string) => Promise<void>
  ) => {
    if (selectedIds.length === 0) return;

    setBulkBusy(true);
    let successCount = 0;

    try {
      for (const id of selectedIds) {
        if (getAdminDemoMode()) {
          successCount += 1;
          continue;
        }
        await action(id);
        successCount += 1;
      }

      toast.success(
        getAdminDemoMode()
          ? `Demo: ${label} simulated for ${selectedIds.length} transaction(s).`
          : `${label} completed for ${successCount} transaction(s).`
      );
      exitSelectionMode();
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `${label} failed after ${successCount} of ${selectedIds.length}.`
      );
      if (successCount > 0) {
        await refresh();
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkActions = useMemo<AdminBulkAction[]>(() => {
    const actions: AdminBulkAction[] = [];

    if (quickActions.clearReview) {
      actions.push({
        key: 'clear',
        label: 'Clear',
        variant: 'primary',
        onClick: () => runBulkTransactionAction('Clear review', (id) => clearTransactionReview(id).then(() => undefined)),
      });
    }
    if (quickActions.unblock) {
      actions.push({
        key: 'unblock',
        label: 'Unblock',
        onClick: () => runBulkTransactionAction('Unblock', (id) => unblockTransaction(id).then(() => undefined)),
      });
    }
    if (quickActions.block) {
      actions.push({
        key: 'block',
        label: 'Block',
        variant: 'danger',
        onClick: () => runBulkTransactionAction('Block', (id) => blockTransaction(id).then(() => undefined)),
      });
    }
    if (quickActions.review) {
      actions.push({
        key: 'review',
        label: 'Review',
        onClick: () => {
          if (selectedIds.length === 0) return;
          if (selectedIds.length > 1) {
            toast.message(`Opening review for the first of ${selectedIds.length} selected.`);
          }
          router.push(`/command-center/transactions/${selectedIds[0]}?tab=fraud`);
          exitSelectionMode();
        },
      });
    }

    return actions;
  }, [quickActions, router, selectedIds, exitSelectionMode]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, statusFilter, userIdFilter]);

  const resolvedCanViewMoneyStats = useMemo(
    () => canViewMoneyStats || canViewTransactionMoneyStats(admin, filters),
    [admin, canViewMoneyStats, filters]
  );

  const statCards = useMemo(() => {
    if (!stats) return [];
    return buildTransactionPageStatCards(stats, resolvedCanViewMoneyStats, {
      totalTransactionsFallback: pagination?.total,
    });
  }, [stats, resolvedCanViewMoneyStats, pagination?.total]);

  const statCardSkeletonCount = getTransactionStatCardCount(resolvedCanViewMoneyStats);

  const flaggedCount = stats?.flagged?.count ?? 0;
  const blockedTotal = stats?.blocked?.count ?? 0;
  const blockedOnPage = transactions.filter((tx) => tx.isBlocked).length;
  const flaggedSeverity = resolveCriticalSeverity(flaggedCount, blockedTotal || blockedOnPage);

  if (!canAccess('transactions.list')) {
    return (
      <div className="transactions_page">
        <h1>Transactions</h1>
        <p className="empty_fallback">You do not have access to transactions.</p>
      </div>
    );
  }

  return (
    <div className="transactions_page">
      <h1>Transactions</h1>

      {userIdFilter && (
        <p className="transactions_user_filter_note">
          Showing transactions for user <code>{userIdFilter}</code>.
        </p>
      )}

      <section className="stats_section">
        {isLoading && !stats
          ? Array.from({ length: statCardSkeletonCount }).map((_, index) => (
              <div key={index} className="stats_card border-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <div>
                  <h2>—</h2>
                  <p>Loading…</p>
                </div>
              </div>
            ))
          : statCards.map((stat) => (
              <div key={stat.key} className={`${stat.border} stats_card`}>
                {stat.icon}
                <div>
                  <h2>{stat.value}</h2>
                  <p>{stat.label}</p>
                  {stat.subtitle && (
                    <p className="stats_card_subtitle">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            ))}
      </section>

      {flaggedSeverity && (
        <AdminCriticalAlert
          severity={flaggedSeverity}
          title={`${flaggedCount} flagged transaction${flaggedCount === 1 ? '' : 's'}`}
          message={
            blockedTotal > 0 || blockedOnPage > 0
              ? `${blockedTotal > 0 ? blockedTotal : blockedOnPage} blocked transaction${
                  (blockedTotal > 0 ? blockedTotal : blockedOnPage) === 1 ? '' : 's'
                } need immediate review. Filter by Flagged to investigate all suspicious activity.`
              : 'Suspicious or under-review transactions need attention. Filter by Flagged to investigate.'
          }
        />
      )}

      <AdminTransactionsListView
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        page={page}
        showQuickActions
        showInternalTestBadge={canViewInternalTestTransactions}
        detailReturnContext={transactionsListReturn}
        actingTxnId={actingTxnId}
        transactions={transactions}
        quickActions={quickActions}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onSearchChange={setSearchTerm}
        onCategoryFilterChange={setCategoryFilter}
        onStatusFilterChange={setStatusFilter}
        onPageChange={setPage}
        onReview={handleReview}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onClearReview={handleClearReview}
        bulkSelect={{
          selectionMode,
          selectedCount,
          isBusy: bulkBusy || Boolean(actingTxnId),
          actions: bulkActions,
          onToggleSelectionMode: toggleSelectionMode,
          isSelected,
          onToggleItem: toggleItem,
        }}
      />
    </div>
  );
}

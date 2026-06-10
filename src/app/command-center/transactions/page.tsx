'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import '@/styles/adminTransactions.css';
import '@/styles/adminShared.css';
import { AdminTransactionsListView } from '@/components/admin/transactions/AdminTransactionsListView';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import { TRANSACTION_FILTER_ALL } from '@/constants/adminTransactionFilters';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminTransactionsList } from '@/hooks/useAdminTransactionsList';
import { useAdminTransactionsListActions } from '@/hooks/useAdminTransactionsListActions';
import { buildTransactionPageStatCards } from '@/utils/buildTransactionPageStatCards';
import {
  canViewTransactionMoneyStats,
  getTransactionStatCardCount,
} from '@/utils/adminTransactionStatsAccess';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const { canAccess, admin } = useAdminAuth();
  const userIdFilter = searchParams.get('userId') ?? undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(TRANSACTION_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(TRANSACTION_FILTER_ALL);
  const [page, setPage] = useState(1);

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

  const { actingTxnId, handleReview, handleBlock, handleUnblock } =
    useAdminTransactionsListActions(refresh);

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
  const blockedCount = transactions.filter((tx) => tx.isBlocked).length;
  const flaggedSeverity = resolveCriticalSeverity(flaggedCount, blockedCount);

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
            blockedCount > 0
              ? `${blockedCount} blocked on this page need immediate review. Filter by Flagged to investigate all suspicious activity.`
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
      />
    </div>
  );
}

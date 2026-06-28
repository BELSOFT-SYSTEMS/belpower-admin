'use client';

import { useEffect, useState } from 'react';
import { AdminTransactionsListView } from '@/components/admin/transactions/AdminTransactionsListView';
import { TRANSACTION_FILTER_ALL } from '@/constants/adminTransactionFilters';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminTransactionsList } from '@/hooks/useAdminTransactionsList';
import { useAdminTransactionsListActions } from '@/hooks/useAdminTransactionsListActions';
import type { AdminReturnContext } from '@/utils/adminReturnNavigation';

type AdminTransactionsListPanelProps = {
  userId?: string;
  partnerId?: string;
  showUser?: boolean;
  enabled?: boolean;
  listTitle?: string;
  searchPlaceholder?: string;
  className?: string;
  isInternalTestAccount?: boolean;
  detailReturnContext?: AdminReturnContext;
  onPaginationTotalChange?: (total: number) => void;
  onActionComplete?: () => void | Promise<void>;
};

export function AdminTransactionsListPanel({
  userId,
  partnerId,
  showUser = true,
  enabled = true,
  listTitle = 'All transactions',
  searchPlaceholder = 'Search transaction ID, reference, session ID, user ID, provider, order ID…',
  className = '',
  isInternalTestAccount = false,
  detailReturnContext,
  onPaginationTotalChange,
  onActionComplete,
}: AdminTransactionsListPanelProps) {
  const { canAccess } = useAdminAuth();
  const canUseQuickActions = canAccess('transactions.list');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(TRANSACTION_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(TRANSACTION_FILTER_ALL);
  const [page, setPage] = useState(1);

  const {
    transactions,
    quickActions,
    pagination,
    isLoading,
    error,
    refresh,
    canViewInternalTestTransactions,
  } = useAdminTransactionsList({
    search: searchTerm,
    typeFilter: categoryFilter,
    statusFilter,
    page,
    userId,
    partnerId,
    enabled,
  });

  const { actingTxnId, handleReview, handleBlock, handleUnblock, handleClearReview } =
    useAdminTransactionsListActions(refresh, onActionComplete, detailReturnContext);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, statusFilter, userId, partnerId]);

  useEffect(() => {
    if (!enabled || !onPaginationTotalChange) return;

    const hasActiveFilters =
      searchTerm.trim().length > 0 ||
      categoryFilter !== TRANSACTION_FILTER_ALL ||
      statusFilter !== TRANSACTION_FILTER_ALL;

    if (!hasActiveFilters && pagination?.total != null) {
      onPaginationTotalChange(pagination.total);
    }
  }, [
    enabled,
    onPaginationTotalChange,
    pagination?.total,
    searchTerm,
    categoryFilter,
    statusFilter,
  ]);

  return (
    <AdminTransactionsListView
      listTitle={listTitle}
      searchPlaceholder={searchPlaceholder}
      className={className}
      searchTerm={searchTerm}
      categoryFilter={categoryFilter}
      statusFilter={statusFilter}
      page={page}
      showUser={partnerId ? false : showUser}
      showQuickActions={canUseQuickActions}
      showInternalTestBadge={canViewInternalTestTransactions}
      isInternalTestAccount={isInternalTestAccount}
      detailReturnContext={detailReturnContext}
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
    />
  );
}

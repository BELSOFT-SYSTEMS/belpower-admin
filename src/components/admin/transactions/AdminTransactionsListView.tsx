'use client';

import { FaSearch } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import {
  AdminBulkSelectToolbar,
  type AdminBulkAction,
} from '@/components/admin/ui/AdminBulkSelectToolbar';
import { AdminTransactionRow } from '@/components/admin/transactions/AdminTransactionRow';
import { TRANSACTION_FILTER_ALL } from '@/constants/adminTransactionFilters';
import type { AdminTransaction } from '@/data/adminMockData';
import type { ApiTransactionListItem, TransactionsQuickActions } from '@/types/adminTransactions';
import { mapApiTransactionListItem } from '@/utils/mapApiTransactionListItem';
import type { AdminReturnContext } from '@/utils/adminReturnNavigation';

type TransactionFilterOption = {
  value: string;
  label: string;
};

type AdminTransactionsListViewProps = {
  listTitle?: string;
  searchPlaceholder?: string;
  className?: string;
  categoryFilterOptions?: TransactionFilterOption[];
  searchTerm: string;
  categoryFilter: string;
  statusFilter: string;
  page: number;
  showUser?: boolean;
  showQuickActions?: boolean;
  showInternalTestBadge?: boolean;
  isInternalTestAccount?: boolean;
  detailReturnContext?: AdminReturnContext;
  actingTxnId: string | null;
  transactions: ApiTransactionListItem[];
  quickActions: TransactionsQuickActions;
  pagination: {
    page: number;
    total: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onReview: (tx: AdminTransaction) => void;
  onBlock: (tx: AdminTransaction) => void;
  onUnblock: (tx: AdminTransaction) => void;
  onClearReview?: (tx: AdminTransaction) => void;
  clearReviewLabel?: string;
  bulkSelect?: {
    selectionMode: boolean;
    selectedCount: number;
    isBusy?: boolean;
    actions: AdminBulkAction[];
    onToggleSelectionMode: () => void;
    isSelected: (id: string) => boolean;
    onToggleItem: (id: string) => void;
  };
};

const DEFAULT_CATEGORY_FILTER_OPTIONS: TransactionFilterOption[] = [
  { value: TRANSACTION_FILTER_ALL, label: 'All services' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Data' },
  { value: 'cable', label: 'Cable' },
  { value: 'deposit', label: 'Wallet funding' },
];

export function AdminTransactionsListView({
  listTitle = 'All transactions',
  searchPlaceholder = 'Search transaction ID, reference, session ID, user ID, provider, order ID…',
  className = '',
  categoryFilterOptions = DEFAULT_CATEGORY_FILTER_OPTIONS,
  searchTerm,
  categoryFilter,
  statusFilter,
  page,
  showUser = true,
  showQuickActions = false,
  showInternalTestBadge = false,
  isInternalTestAccount = false,
  detailReturnContext,
  actingTxnId,
  transactions,
  quickActions,
  pagination,
  isLoading,
  error,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onPageChange,
  onReview,
  onBlock,
  onUnblock,
  onClearReview,
  clearReviewLabel,
  bulkSelect,
}: AdminTransactionsListViewProps) {
  const totalPages = pagination?.totalPages ?? pagination?.total_pages ?? 1;
  const panelClassName = ['admin_txn_list_panel', className].filter(Boolean).join(' ');

  return (
    <section className={panelClassName}>
      <div className="manage_header">
        <h2>{listTitle}</h2>
        <div className="search_container">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            maxLength={128}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <FaSearch />
        </div>
      </div>

      <AdminBulkSelectToolbar
        selectionMode={Boolean(bulkSelect?.selectionMode)}
        selectedCount={bulkSelect?.selectedCount ?? 0}
        isBusy={bulkSelect?.isBusy}
        actions={bulkSelect?.actions ?? []}
        onToggleSelectionMode={bulkSelect?.onToggleSelectionMode ?? (() => undefined)}
        filters={
          <>
            <AdminDropdown
              variant="filter"
              value={categoryFilter}
              onChange={onCategoryFilterChange}
              aria-label="Filter by service"
              options={categoryFilterOptions}
            />
            <AdminDropdown
              variant="filter"
              value={statusFilter}
              onChange={onStatusFilterChange}
              aria-label="Filter by status"
              options={[
                { value: TRANSACTION_FILTER_ALL, label: 'All status' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'flagged', label: 'Flagged' },
              ]}
            />
          </>
        }
      />

      {error && <p className="empty_fallback admin_txn_list_error">{error}</p>}

      {isLoading ? (
        <div className="admin_txn_list_loading">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span>Loading transactions…</span>
        </div>
      ) : (
        <>
          <div className="admin_txn_list">
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                const row = mapApiTransactionListItem(tx);
                return (
                  <AdminTransactionRow
                    key={tx.id}
                    transaction={row}
                    showUser={showUser}
                    showQuickActions={showQuickActions}
                    quickActions={quickActions}
                    isInternalTestAccount={
                      showInternalTestBadge &&
                      (tx.isInternalTestAccount ?? isInternalTestAccount)
                    }
                    rowBusy={actingTxnId === tx.id}
                    detailReturnContext={detailReturnContext}
                    selectionMode={bulkSelect?.selectionMode}
                    selected={bulkSelect?.isSelected(tx.id)}
                    onToggleSelect={() => bulkSelect?.onToggleItem(tx.id)}
                    onReview={onReview}
                    onBlock={onBlock}
                    onUnblock={onUnblock}
                    onClearReview={onClearReview}
                    clearReviewLabel={clearReviewLabel}
                  />
                );
              })
            ) : (
              <p className="empty_fallback admin_txn_list_empty">
                No transactions match your filters.
              </p>
            )}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="transactions_pagination_bar">
              <p className="transactions_pagination_meta">
                Page {pagination.page} of {totalPages} ·{' '}
                {pagination.total.toLocaleString()} transactions
              </p>
              <div className="pagination_section">
                <button
                  type="button"
                  className="pagination_btn"
                  disabled={page <= 1}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <span className="current btn_active">{page}</span>
                <button
                  type="button"
                  className="pagination_btn"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

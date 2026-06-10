'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaHome,
  FaCalendarAlt,
  FaUndo,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminTransactions.css';
import '@/styles/adminShared.css';
import { AdminTransactionsListView } from '@/components/admin/transactions/AdminTransactionsListView';
import { TRANSACTION_FILTER_ALL } from '@/constants/adminTransactionFilters';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminTransactionsList } from '@/hooks/useAdminTransactionsList';
import { useAdminTransactionsListActions } from '@/hooks/useAdminTransactionsListActions';
import { formatPrice } from '@/utils/FormatPrice';

type StatCard = {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  border: string;
};

function formatTransactionCountSubtitle(count: number): string {
  return `${count.toLocaleString()} transaction${count === 1 ? '' : 's'}`;
}

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const { canAccess } = useAdminAuth();
  const userIdFilter = searchParams.get('userId') ?? undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(TRANSACTION_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(TRANSACTION_FILTER_ALL);
  const [page, setPage] = useState(1);

  const {
    transactions,
    quickActions,
    stats,
    pagination,
    isLoading,
    error,
    refresh,
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

  const statCards = useMemo<StatCard[]>(() => {
    if (!stats) return [];

    return [
      {
        key: 'volume',
        icon: <FaHome className="text-blue-500 text-xl" />,
        label: 'Total volume',
        value: formatPrice(stats.totalVolume.amount),
        border: 'border-blue-300',
      },
      {
        key: 'completedVolume',
        icon: <FaCheckCircle className="text-green-500 text-xl" />,
        label: 'Completed volume',
        value: formatPrice(stats.completed.amount),
        subtitle: formatTransactionCountSubtitle(stats.completed.count),
        border: 'border-green-300',
      },
      {
        key: 'pendingVolume',
        icon: <FaClock className="text-yellow-500 text-xl" />,
        label: 'Pending volume',
        value: formatPrice(stats.pending.amount),
        subtitle: formatTransactionCountSubtitle(stats.pending.count),
        border: 'border-yellow-300',
      },
      {
        key: 'refunds',
        icon: <FaUndo className="text-purple-500 text-xl" />,
        label: 'Refunds',
        value: formatPrice(stats.refunds.amount),
        subtitle: formatTransactionCountSubtitle(stats.refunds.count),
        border: 'border-purple-300',
      },
      {
        key: 'scheduled',
        icon: <FaCalendarAlt className="text-orange-500 text-xl" />,
        label: 'Scheduled',
        value: stats.scheduled.count.toLocaleString(),
        border: 'border-orange-300',
      },
      {
        key: 'flagged',
        icon: <FaTimesCircle className="text-red-500 text-xl" />,
        label: 'Flagged',
        value: stats.flagged.count.toLocaleString(),
        border: 'border-red-300',
      },
    ];
  }, [stats]);

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
          ? Array.from({ length: 6 }).map((_, index) => (
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

      <AdminTransactionsListView
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        page={page}
        showQuickActions
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminWallet.css';
import '@/styles/adminShared.css';
import '@/styles/adminTransactions.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { AdminTransactionRow } from '@/components/admin/transactions/AdminTransactionRow';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { formatPrice } from '@/utils/FormatPrice';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import { mapApiTransactionListItem } from '@/utils/mapApiTransactionListItem';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminWallet } from '@/hooks/useAdminWallet';
import { useAdminTransactionsListActions } from '@/hooks/useAdminTransactionsListActions';
import { canViewWalletMoneyStats, canViewWalletPage } from '@/utils/adminWalletAccess';

const FILTER_ALL = '__all__';

function formatBalanceValue(
  amount: number | null,
  canView: boolean
): { value: string; isNegative: boolean } {
  if (!canView || amount == null) {
    return { value: '—', isNegative: false };
  }
  return { value: formatPrice(amount), isNegative: amount < 0 };
}

export default function WalletPage() {
  const { admin } = useAdminAuth();
  const canAccessPage = canViewWalletPage(admin);
  const canViewMoney = canViewWalletMoneyStats(admin);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [page, setPage] = useState(1);

  const {
    stats,
    transactions,
    quickActions,
    pagination,
    isLoading,
    error,
    refresh,
  } = useAdminWallet({
    search: searchTerm,
    categoryFilter,
    statusFilter,
    page,
    enabled: canAccessPage,
  });

  const { actingTxnId, handleReview, handleBlock, handleUnblock } =
    useAdminTransactionsListActions(refresh);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const flaggedCount = stats?.flaggedCount.count ?? 0;
  const flaggedSeverity = resolveCriticalSeverity(flaggedCount);

  const totalUserBalance = stats?.totalUserBalance;
  const buyPowerBalance = stats?.buyPowerBalance;

  const totalBalanceDisplay = formatBalanceValue(
    totalUserBalance?.amount ?? null,
    Boolean(totalUserBalance?.canView && canViewMoney)
  );
  const buyPowerDisplay = formatBalanceValue(
    buyPowerBalance?.amount ?? null,
    Boolean(buyPowerBalance?.canView && canViewMoney)
  );

  const walletStats = useMemo(
    () => [
      {
        key: 'totalUserBalance',
        icon: <FaWallet className="text-blue-500 text-xl" />,
        label: 'Total user wallet balance',
        value: totalBalanceDisplay.value,
        valueClassName: totalBalanceDisplay.isNegative ? 'wallet_balance_negative' : undefined,
        sub: totalUserBalance?.canView && canViewMoney ? 'Across all users' : 'Restricted',
        border: 'border-blue-200',
      },
      {
        key: 'funding',
        icon: <FaArrowUp className="text-green-500 text-xl" />,
        label: 'Wallet funding',
        value: stats ? String(stats.fundingCount.count.toLocaleString()) : '—',
        sub: 'Top-ups & deposits',
        border: 'border-green-200',
      },
      {
        key: 'debits',
        icon: <FaArrowDown className="text-orange-500 text-xl" />,
        label: 'Wallet debits',
        value: stats ? String(stats.debitCount.count.toLocaleString()) : '—',
        sub: 'Paid from wallet',
        border: 'border-orange-200',
      },
      {
        key: 'buyPower',
        icon: <FaWallet className="text-purple-500 text-xl" />,
        label: 'BuyPower wallet balance',
        value: buyPowerDisplay.value,
        valueClassName: buyPowerDisplay.isNegative ? 'wallet_balance_negative' : undefined,
        sub:
          buyPowerBalance?.canView && canViewMoney
            ? buyPowerBalance.lastUpdated
              ? `Updated ${new Date(buyPowerBalance.lastUpdated).toLocaleString()}`
              : 'Platform float'
            : 'Restricted',
        border: 'border-purple-200',
      },
    ],
    [
      stats,
      canViewMoney,
      totalBalanceDisplay,
      buyPowerDisplay,
      totalUserBalance,
      buyPowerBalance,
    ]
  );

  const totalPages = pagination?.totalPages ?? 1;

  if (!canAccessPage) {
    return (
      <div className="wallet_page">
        <h1>Wallet</h1>
        <p className="empty_fallback">You do not have access to wallet activity.</p>
      </div>
    );
  }

  return (
    <div className="wallet_page">
      <h1>Wallet</h1>
      <p className="wallet_subtitle">
        Wallet funding and payments made from wallet balance. Opens the same transaction detail
        as all transactions, with fraud flags.
      </p>

      <section className="stats_section">
        {isLoading && !stats
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="stats_card border-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <div className="stats_bottom">
                  <h2>—</h2>
                  <p>Loading…</p>
                </div>
              </div>
            ))
          : walletStats.map((stat) => (
              <div key={stat.key} className={`${stat.border} stats_card`}>
                <div className="stats_header">
                  <p>{stat.label}</p>
                  {stat.icon}
                </div>
                <div className="stats_bottom">
                  <h2 className={stat.valueClassName}>{stat.value}</h2>
                  <p>{stat.sub}</p>
                </div>
              </div>
            ))}
      </section>

      {flaggedSeverity && (
        <AdminCriticalAlert
          severity={flaggedSeverity}
          title={`${flaggedCount} flagged wallet transaction${flaggedCount === 1 ? '' : 's'}`}
          message="Review suspicious top-ups and wallet debits below."
        />
      )}

      <section className="wallet_list_section">
        <div className="manage_header">
          <h2>Recent wallet activity</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search ID, user, reference…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch />
          </div>
        </div>

        <div className="admin_filter_row">
          <AdminDropdown
            variant="filter"
            value={categoryFilter}
            onChange={setCategoryFilter}
            aria-label="Filter by activity type"
            options={[
              { value: FILTER_ALL, label: 'All wallet activity' },
              { value: 'deposit', label: 'Wallet funding' },
              { value: 'debit', label: 'Wallet debit' },
            ]}
          />
          <AdminDropdown
            variant="filter"
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter by status"
            options={[
              { value: FILTER_ALL, label: 'All status' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'flagged', label: 'Flagged' },
            ]}
          />
        </div>

        {error && <p className="empty_fallback admin_txn_list_error">{error}</p>}

        {isLoading ? (
          <div className="admin_txn_list_loading">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span>Loading wallet activity…</span>
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
                      showQuickActions
                      quickActions={quickActions}
                      rowBusy={actingTxnId === tx.id}
                      onReview={handleReview}
                      onBlock={handleBlock}
                      onUnblock={handleUnblock}
                    />
                  );
                })
              ) : (
                <p className="empty_fallback" style={{ padding: '2rem' }}>
                  No wallet activity matches your filters.
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
                    onClick={() => setPage(Math.max(1, page - 1))}
                  >
                    Previous
                  </button>
                  <span className="current btn_active">{page}</span>
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

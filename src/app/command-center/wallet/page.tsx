'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaWallet, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminWallet.css';
import '@/styles/adminShared.css';
import '@/styles/adminTransactions.css';
import { AdminTransactionsListView } from '@/components/admin/transactions/AdminTransactionsListView';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { formatPrice } from '@/utils/FormatPrice';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminWallet } from '@/hooks/useAdminWallet';
import { useAdminTransactionsListActions } from '@/hooks/useAdminTransactionsListActions';
import { canViewWalletMoneyStats, canViewWalletPage } from '@/utils/adminWalletAccess';
import type { WalletActivityFilter } from '@/types/adminWallet';
import { buildWalletReturn } from '@/utils/adminReturnNavigation';

const FILTER_ALL = '__all__' as const;
type WalletCategoryFilter = WalletActivityFilter | typeof FILTER_ALL;

const WALLET_CATEGORY_FILTER_OPTIONS = [
  { value: FILTER_ALL, label: 'All wallet activity' },
  { value: 'deposit', label: 'Wallet funding' },
  { value: 'debit', label: 'Wallet debit' },
];

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
  const [categoryFilter, setCategoryFilter] = useState<WalletCategoryFilter>(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
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

  const walletReturn = useMemo(() => buildWalletReturn(), []);

  const { actingTxnId, handleReview, handleBlock, handleUnblock, handleClearReview } =
    useAdminTransactionsListActions(refresh, undefined, walletReturn);

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
  const profitDisplay = formatBalanceValue(
    stats?.profit?.amount ?? null,
    Boolean(stats?.profit?.canView && canViewMoney)
  );

  const walletStats = useMemo(() => {
    const cards = [];

    if (canViewMoney) {
      cards.push({
        key: 'totalUserBalance',
        icon: <FaWallet className="text-blue-500 text-xl" />,
        label: 'Total user wallet balance',
        value: totalBalanceDisplay.value,
        valueClassName: totalBalanceDisplay.isNegative ? 'wallet_balance_negative' : undefined,
        sub: 'Current balance held in customer wallets',
        border: 'border-blue-200',
      });
    }

    cards.push(
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
      }
    );

    if (canViewMoney) {
      cards.push(
        {
          key: 'profit',
          icon: <FaChartLine className="text-emerald-500 text-xl" />,
          label: 'Profit',
          value: profitDisplay.value,
          sub: 'Service charges (NGN)',
          border: 'border-emerald-200',
        },
        {
          key: 'buyPower',
          icon: <FaWallet className="text-purple-500 text-xl" />,
          label: 'BuyPower wallet balance',
          value: buyPowerDisplay.value,
          valueClassName: buyPowerDisplay.isNegative ? 'wallet_balance_negative' : undefined,
          sub: buyPowerBalance?.lastUpdated
            ? `Updated ${new Date(buyPowerBalance.lastUpdated).toLocaleString()}`
            : 'Platform float',
          border: 'border-purple-200',
        }
      );
    }

    return cards;
  }, [stats, canViewMoney, totalBalanceDisplay, buyPowerDisplay, profitDisplay, buyPowerBalance]);

  const statsCardCount = canViewMoney ? 5 : 2;

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
          ? Array.from({ length: statsCardCount }).map((_, index) => (
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

      <AdminTransactionsListView
        listTitle="Recent wallet activity"
        searchPlaceholder="Search ID, user, reference…"
        categoryFilterOptions={WALLET_CATEGORY_FILTER_OPTIONS}
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        page={page}
        showQuickActions
        detailReturnContext={walletReturn}
        actingTxnId={actingTxnId}
        transactions={transactions}
        quickActions={quickActions}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onSearchChange={setSearchTerm}
        onCategoryFilterChange={(value) => setCategoryFilter(value as WalletCategoryFilter)}
        onStatusFilterChange={setStatusFilter}
        onPageChange={setPage}
        onReview={handleReview}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onClearReview={handleClearReview}
      />
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import {
  FaSearch,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
} from 'react-icons/fa';
import '@/styles/adminWallet.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { formatPrice } from '@/utils/FormatPrice';
import {
  BUYPOWER_WALLET_BALANCE,
  getWalletTransactions,
} from '@/data/adminMockData';
import { AdminTransactionRow } from '@/components/admin/transactions/AdminTransactionRow';
import { matchesTransactionStatusFilter } from '@/utils/adminTransactionDisplay';

const FILTER_ALL = '__all__';

export default function WalletPage() {
  const walletTransactions = useMemo(() => getWalletTransactions(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);

  const flaggedCount = walletTransactions.filter((t) => t.suspicious).length;
  const topUpCount = walletTransactions.filter((t) => t.type === 'deposit').length;
  const debitCount = walletTransactions.filter(
    (t) => t.type !== 'deposit' && t.payment_method?.toLowerCase() === 'wallet'
  ).length;

  const walletStats = useMemo(
    () => [
      {
        icon: <FaWallet className="text-blue-500 text-xl" />,
        label: 'Total user wallet balance',
        value: formatPrice(285_000),
        sub: 'Across all users (mock)',
        border: 'border-blue-200',
      },
      {
        icon: <FaArrowUp className="text-green-500 text-xl" />,
        label: 'Wallet funding',
        value: String(topUpCount),
        sub: 'Top-ups & deposits',
        border: 'border-green-200',
      },
      {
        icon: <FaArrowDown className="text-orange-500 text-xl" />,
        label: 'Wallet debits',
        value: String(debitCount),
        sub: 'Paid from wallet',
        border: 'border-orange-200',
      },
      {
        icon: <FaWallet className="text-purple-500 text-xl" />,
        label: 'BuyPower Wallet Balance',
        value: formatPrice(BUYPOWER_WALLET_BALANCE),
        sub: 'Platform float',
        border: 'border-purple-200',
      },
    ],
    [topUpCount, debitCount]
  );

  const filtered = useMemo(() => {
    return walletTransactions.filter((tx) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        tx.user_name.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q) ||
        tx.provider.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === FILTER_ALL ||
        (categoryFilter === 'deposit' && tx.type === 'deposit') ||
        (categoryFilter === 'debit' && tx.type !== 'deposit');
      const matchesStatus = matchesTransactionStatusFilter(tx, statusFilter, FILTER_ALL);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [walletTransactions, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="wallet_page">
      <h1>Wallet</h1>
      <p className="wallet_subtitle">
        Wallet funding and payments made from wallet balance. Opens the same transaction detail
        as all transactions, with fraud flags.
      </p>

      <section className="stats_section">
        {walletStats.map((stat, index) => (
          <div key={index} className={`${stat.border} stats_card`}>
            <div className="stats_header">
              <p>{stat.label}</p>
              {stat.icon}
            </div>
            <div className="stats_bottom">
              <h2>{stat.value}</h2>
              <p>{stat.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {flaggedCount > 0 && (
        <div className="admin_alert admin_alert_warning wallet_flagged_alert">
          <FaExclamationTriangle />
          <div>
            <strong>{flaggedCount} flagged wallet transaction(s)</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              Review suspicious top-ups and wallet debits below.
            </p>
          </div>
        </div>
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

        <div className="admin_txn_list">
          {filtered.length > 0 ? (
            filtered.map((tx) => <AdminTransactionRow key={tx.id} transaction={tx} />)
          ) : (
            <p className="empty_fallback" style={{ padding: '2rem' }}>
              No wallet activity matches your filters.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

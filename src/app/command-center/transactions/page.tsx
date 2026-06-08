'use client';

import { useMemo, useState } from 'react';
import { FaSearch, FaCheckCircle, FaClock, FaTimesCircle, FaHome, FaCalendarAlt } from 'react-icons/fa';
import '@/styles/adminTransactions.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { MOCK_TRANSACTIONS } from '@/data/adminMockData';
import { AdminTransactionRow } from '@/components/admin/transactions/AdminTransactionRow';
import { matchesTransactionStatusFilter } from '@/utils/adminTransactionDisplay';

const FILTER_ALL = '__all__';

const stats = [
  {
    icon: <FaHome className="text-blue-500 text-xl" />,
    label: 'Total volume',
    value: '₦2,500,000',
    border: 'border-blue-300',
  },
  {
    icon: <FaCheckCircle className="text-green-500 text-xl" />,
    label: 'Completed',
    value: '2,544',
    border: 'border-green-300',
  },
  {
    icon: <FaClock className="text-yellow-500 text-xl" />,
    label: 'Pending',
    value: '156',
    border: 'border-yellow-300',
  },
  {
    icon: <FaCalendarAlt className="text-orange-500 text-xl" />,
    label: 'Scheduled',
    value: String(MOCK_TRANSACTIONS.filter((t) => t.is_scheduled).length),
    border: 'border-orange-300',
  },
  {
    icon: <FaTimesCircle className="text-red-500 text-xl" />,
    label: 'Flagged',
    value: '12',
    border: 'border-red-300',
  },
];

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);

  const filtered = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((tx) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        tx.user_name.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q) ||
        tx.provider.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === FILTER_ALL || tx.type === categoryFilter;
      const matchesStatus = matchesTransactionStatusFilter(tx, statusFilter, FILTER_ALL);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="transactions_page">
      <h1>Transactions</h1>
      <p className="transactions_subtitle">
        Monitor all platform payments. Layout mirrors consumer transaction history; mock data
        only.
      </p>

      <section className="stats_section">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.border} stats_card`}>
            {stat.icon}
            <div>
              <h2>{stat.value}</h2>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="transactions_list_section">
        <div className="manage_header">
          <h2>All transactions</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search ID, user, provider…"
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
            aria-label="Filter by service"
            options={[
              { value: FILTER_ALL, label: 'All services' },
              { value: 'electricity', label: 'Electricity' },
              { value: 'airtime', label: 'Airtime' },
              { value: 'data', label: 'Data' },
              { value: 'cable', label: 'Cable' },
              { value: 'deposit', label: 'Wallet funding' },
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
              No transactions match your filters.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

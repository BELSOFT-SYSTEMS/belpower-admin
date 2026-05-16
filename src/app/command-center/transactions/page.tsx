'use client';

import Image from 'next/image';
import { FaSearch, FaCheckCircle, FaClock, FaTimesCircle, FaHome } from 'react-icons/fa';
import '@/styles/adminTransactions.css';
import { formatPrice } from '@/utils/FormatPrice';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const stats = [
  {
    icon: <FaHome className="text-blue-500 text-xl" />,
    label: 'Total Payments',
    value: '₦2,500,000',
    border: 'border-blue-300',
  },
  {
    icon: <FaCheckCircle className="text-green-500 text-xl" />,
    label: 'Completed Transactions',
    value: '2,544',
    border: 'border-green-300',
  },
  {
    icon: <FaClock className="text-yellow-500 text-xl" />,
    label: 'Pending Transactions',
    value: '156',
    border: 'border-yellow-300',
  },
  {
    icon: <FaTimesCircle className="text-red-500 text-xl" />,
    label: 'Failed Transactions',
    value: '23',
    border: 'border-red-300',
  },
];

type TransactionStatus = 'Completed' | 'Pending' | 'Failed';
type Transaction = {
  id: string;
  name: string;
  service: string;
  amount: number;
  status: TransactionStatus;
  date: string;
  avatar: string;
};

const transactions: Transaction[] = [
  {
    id: '#TRX-789456',
    name: 'John Travis',
    service: 'Electricity',
    amount: 5000,
    status: 'Completed',
    date: 'Jan 15, 2025 14:30',
    avatar: '/Profile.png',
  },
  {
    id: '#TRX-789457',
    name: 'Debbie Michael',
    service: 'Data',
    amount: 10000,
    status: 'Pending',
    date: 'Jan 15, 2025 13:20',
    avatar: '/Profile.png',
  },
  {
    id: '#TRX-789458',
    name: 'Israel Femi',
    service: 'Airtime',
    amount: 2000,
    status: 'Completed',
    date: 'Jan 14, 2025 11:45',
    avatar: '/Profile.png',
  },
  {
    id: '#TRX-789457',
    name: 'Debbie Michael',
    service: 'Data',
    amount: 10000,
    status: 'Failed',
    date: 'Jan 15, 2025 13:20',
    avatar: '/Profile.png',
  },
];

const statusColor = {
  Completed: 'success_color',
  Pending: 'pending_color',
  Failed: 'failed_color',
};

export default function TransactionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const filteredTransaction = useMemo(() => {
    return transactions.filter(
      (trx) =>
        trx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredTransaction.length / usersPerPage);
  const displayedTransactions = filteredTransaction.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="transactions_page">
      {/* Header */}
      <h1>Recent Transactions</h1>

      {/* Stat Cards */}
      <section className="stats_section">
        {stats.length > 0 ? (
          stats.map((stat, index) => (
            <div key={index} className={` ${stat.border} stats_card`}>
              {stat.icon}
              <div>
                <h2>{stat.value}</h2>
                <p>{stat.label}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty_fallback">No stats available.</div>
        )}
      </section>

      <section>
        {/* Table Header */}
        <div className="manage_header">
          <h2>Recent Transactions</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <FaSearch />
          </div>
        </div>

        {/* Table */}
        <div className="table_container">
          <table>
            <thead>
              <tr>
                <th className="py-3">Transaction ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((tx, idx) => (
                  <tr
                    key={idx}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/transactions/${tx.id.replace('#', '')}`)}
                  >
                    <td className="py-3">{tx.id}</td>
                    <td className="py-3 avatar_container">
                      <Image src={tx.avatar} alt="avatar" width={24} height={24} />
                      {tx.name}
                    </td>
                    <td>{tx.service}</td>
                    <td>{formatPrice(tx.amount)}</td>
                    <td>
                      <span className={`transaction_status ${statusColor[tx.status]}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{tx.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty_fallback">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="pagination_section">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="pagination_btn"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`current ${currentPage === idx + 1 ? 'btn_active' : 'btn_inactive'}`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="pagination_btn"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </section>
      )}
    </div>
  );
}

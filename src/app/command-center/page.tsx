'use client';

import Image from 'next/image';
import { FaHome, FaUsers, FaClipboardList, FaClock, FaUserSlash, FaTrashAlt } from 'react-icons/fa';
import { TbCancel } from 'react-icons/tb';
import '@/styles/adminHome.css';
import { formatPrice } from '@/utils/FormatPrice';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';

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

function DashboardHome() {
  const stats = [
    {
      icon: <FaHome className="text-green-500 text-2xl" />,
      label: 'Total Payments',
      value: '₦2,500,000',
      border: 'border-green-200',
    },
    {
      icon: <FaClipboardList className="text-blue-500 text-2xl" />,
      label: 'Total Transactions',
      value: '20,000',
      border: 'border-blue-200',
    },
    {
      icon: <FaUsers className="text-purple-500 text-2xl" />,
      label: 'Active Users',
      value: '1,240',
      border: 'border-purple-200',
    },
    {
      icon: <FaClock className="text-yellow-500 text-2xl" />,
      label: 'Pending Transactions',
      value: '89',
      border: 'border-yellow-200',
    },
  ];

  const recentTransactions: Transaction[] = [
    {
      id: '#TRX-789456',
      name: 'John Travis',
      service: 'Electricity',
      amount: 5000,
      status: 'Completed',
      date: 'Jan 15, 2025',
      avatar: '/Profile.png',
    },
    {
      id: '#TRX-789457',
      name: 'Debbie Michael',
      service: 'Data',
      amount: 10000,
      status: 'Pending',
      date: 'Jan 15, 2025',
      avatar: '/Profile.png',
    },
    {
      id: '#TRX-789458',
      name: 'Israel Femi',
      service: 'Airtime',
      amount: 2000,
      status: 'Completed',
      date: 'Jan 14, 2025',
      avatar: '/Profile.png',
    },
  ];

  const statusColor = {
    Completed: 'success_color',
    Pending: 'pending_color',
    Failed: 'failed_color',
  };

  const newUsers = [
    {
      name: 'John Travis',
      status: 'Active',
      lastActive: '2 mins ago',
      avatar: '/Profile.png',
    },
    {
      name: 'John Travis',
      status: 'Active',
      lastActive: '2 mins ago',
      avatar: '/Profile.png',
    },
    {
      name: 'John Travis',
      status: 'Active',
      lastActive: '2 mins ago',
      avatar: '/Profile.png',
    },
    {
      name: 'John Travis',
      status: 'Active',
      lastActive: '2 mins ago',
      avatar: '/Profile.png',
    },
  ];

  return (
    <div className="admin_homePage">
      <h1>Welcome, Command Center Admin</h1>

      {/* Stats */}
      <section className="stats_section">
        {stats.length > 0 ? (
          stats.map((stat, idx) => (
            <div key={idx} className={`stats_card ${stat.border}`}>
              <div>{stat.icon}</div>
              <div>
                <h2>{stat.value}</h2>
                <p>{stat.label}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty_fallback">No stats available</div>
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="section_header">
          <h2>Recent Transactions</h2>
          <button className="download">Download</button>
        </div>
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
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx, idx) => (
                  <tr key={idx}>
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
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* New Users */}
      <section>
        <h2>New Users</h2>
        <div className="table_container">
          <table>
            <thead>
              <tr>
                <th className="py-3">User</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {newUsers.length > 0 ? (
                newUsers.map((user, idx) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="avatar_container">
                        <Image src={user.avatar} alt="avatar" width={24} height={24} />
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="user_status">{user.status}</span>
                    </td>
                    <td>{user.lastActive}</td>
                    <td>
                      <div className="user_actions">
                        <button title="Suspend" className="suspend">
                          <FaUserSlash />
                          Suspend
                        </button>
                        <button title="Deactivate" className="deactivate">
                          <TbCancel />
                          Deactivate
                        </button>
                        <button title="Delete" className="delete">
                          <FaTrashAlt />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty_fallback">
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <DashboardHome />
    </ProtectedRoute>
  );
}

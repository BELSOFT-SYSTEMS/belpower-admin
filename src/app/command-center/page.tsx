'use client';

import { FaHome, FaUsers, FaClipboardList, FaClock } from 'react-icons/fa';
import '@/styles/adminHome.css';
import { formatPrice } from '@/utils/FormatPrice';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  timeAgo: string;
};

type NewUser = {
  name: string;
  timeAgo: string;
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
      amount: 5000,
      timeAgo: '5 mins ago',
    },
    {
      id: '#TRX-789457',
      name: 'Debbie Michael',
      amount: 10000,
      timeAgo: '12 mins ago',
    },
    {
      id: '#TRX-789458',
      name: 'Israel Femi',
      amount: 2000,
      timeAgo: '25 mins ago',
    },
    {
      id: '#TRX-789459',
      name: 'Sarah Johnson',
      amount: 7500,
      timeAgo: '1 hour ago',
    },
    {
      id: '#TRX-789460',
      name: 'Mike Williams',
      amount: 3000,
      timeAgo: '2 hours ago',
    },
  ];

  const newUsers: NewUser[] = [
    {
      name: 'John Travis',
      timeAgo: '5 mins ago',
    },
    {
      name: 'Debbie Michael',
      timeAgo: '15 mins ago',
    },
    {
      name: 'Israel Femi',
      timeAgo: '30 mins ago',
    },
    {
      name: 'Sarah Johnson',
      timeAgo: '1 hour ago',
    },
    {
      name: 'Mike Williams',
      timeAgo: '2 hours ago',
    },
  ];

  // Revenue data for chart
  const revenueData = [
    { month: 'Jan', revenue: 400000 },
    { month: 'Feb', revenue: 600000 },
    { month: 'Mar', revenue: 550000 },
    { month: 'Apr', revenue: 800000 },
    { month: 'May', revenue: 700000 },
    { month: 'Jun', revenue: 950000 },
  ];

  // User growth data for chart
  const userGrowthData = [
    { month: 'Jan', users: 150 },
    { month: 'Feb', users: 230 },
    { month: 'Mar', users: 310 },
    { month: 'Apr', users: 420 },
    { month: 'May', users: 580 },
    { month: 'Jun', users: 720 },
  ];

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

      {/* Two Column Layout */}
      <div className="content_grid">
        {/* Left Column */}
        <div className="left_column">
          {/* Recent Transactions Card */}
          <div className="card">
            <h2>Recent Transactions</h2>
            <div className="card_list">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx, idx) => (
                  <div key={idx} className="card_item">
                    <div className="card_avatar">
                      {getInitials(tx.name)}
                    </div>
                    <div className="card_content">
                      <p className="card_name">{tx.name}</p>
                      <p className="card_amount">{formatPrice(tx.amount)}</p>
                    </div>
                    <p className="card_time">{tx.timeAgo}</p>
                  </div>
                ))
              ) : (
                <p className="empty_fallback">No recent transactions</p>
              )}
            </div>
          </div>

          {/* New Users Card */}
          <div className="card">
            <h2>New Users</h2>
            <div className="card_list">
              {newUsers.length > 0 ? (
                newUsers.map((user, idx) => (
                  <div key={idx} className="card_item">
                    <div className="card_avatar">
                      {getInitials(user.name)}
                    </div>
                    <div className="card_content">
                      <p className="card_name">{user.name}</p>
                    </div>
                    <p className="card_time">{user.timeAgo}</p>
                  </div>
                ))
              ) : (
                <p className="empty_fallback">No new users</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="right_column">
          <div className="chart_card">
            <h2>Revenue Overview</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                  formatter={(value: unknown) => typeof value === 'number' ? formatPrice(value) : String(value || '')}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0064FF" strokeWidth={2} dot={{ fill: '#0064FF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart_card">
            <h2>User Growth</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                />
                <Legend />
                <Bar dataKey="users" fill="#0064FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
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

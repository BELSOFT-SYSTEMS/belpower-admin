'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FaHome, FaUsers, FaClipboardList, FaClock, FaExpand, FaShieldAlt } from 'react-icons/fa';
import { AdminDemoToggle } from '@/components/admin/ui/AdminDemoToggle';
import { useIsAdminDemoMode } from '@/context/AdminDemoContext';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { Loader2 } from 'lucide-react';
import '@/styles/adminHome.css';
import '@/styles/adminShared.css';
import { formatPrice } from '@/utils/FormatPrice';
import { formatLastActive } from '@/utils/formatLastActive';
import { getInitialsFromDisplayName } from '@/utils/userAvatar';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { formatAdminRole, getRolePillClass } from '@/utils/adminRoleDisplay';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import {
  mapCountChartPoints,
  mapRevenueChartPoints,
  showRevenueChart,
  showTotalPayments,
} from '@/lib/adminDashboard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useMemo, useRef, useState } from 'react';

type StatCard = {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  border: string;
};

function DashboardHome() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get('userId') ?? undefined;
  const { displayName, admin, canAccess } = useAdminAuth();
  const canViewFraud = canAccess('fraud.view');
  const { data, isLoading, error, refresh } = useDashboardOverview({ userId: userIdFilter });
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const demoMode = useIsAdminDemoMode();
  const skipPathRefreshRef = useRef(true);

  useEffect(() => {
    if (getAdminDemoMode()) return;

    if (skipPathRefreshRef.current) {
      skipPathRefreshRef.current = false;
      return;
    }

    if (pathname === '/command-center') {
      refresh({ silent: true });
    }
  }, [pathname, refresh]);

  const showInternalTestBadge = Boolean(data?.filters?.canViewInternalTestUsers);
  const appliedUserId = data?.filters?.appliedUserId ?? userIdFilter ?? null;

  const showPayments = showTotalPayments(data?.stats);
  const showRevenue = showRevenueChart(data?.charts);

  const revenueData = useMemo(
    () =>
      mapRevenueChartPoints(data?.charts).map((point) => ({
        month: point.label,
        revenue: point.value,
      })),
    [data?.charts]
  );

  const userGrowthData = useMemo(
    () =>
      mapCountChartPoints(data?.charts?.userGrowth).map((point) => ({
        month: point.label,
        users: point.value,
      })),
    [data?.charts?.userGrowth]
  );

  const transactionVolumeData = useMemo(
    () =>
      mapCountChartPoints(data?.charts?.transactionVolume).map((point) => ({
        month: point.label,
        volume: point.value,
      })),
    [data?.charts?.transactionVolume]
  );

  const statCards = useMemo<StatCard[]>(() => {
    if (!data?.stats) return [];

    const cards: StatCard[] = [];

    if (showPayments) {
      cards.push({
        key: 'totalPayments',
        icon: <FaHome className="text-green-500 text-2xl" />,
        label: 'Total Payments',
        value: formatPrice(data.stats.totalPayments.amount),
        border: 'border-green-200',
      });
    }

    cards.push(
      {
        key: 'totalTransactions',
        icon: <FaClipboardList className="text-blue-500 text-2xl" />,
        label: 'Total Transactions',
        value: data.stats.totalTransactions.toLocaleString(),
        border: 'border-blue-200',
      },
      {
        key: 'activeUsers',
        icon: <FaUsers className="text-purple-500 text-2xl" />,
        label: 'Active Users',
        value: data.stats.activeUsers.toLocaleString(),
        border: 'border-purple-200',
      },
      {
        key: 'pendingTransactions',
        icon: <FaClock className="text-yellow-500 text-2xl" />,
        label: 'Pending Transactions',
        value: data.stats.pendingTransactions.toLocaleString(),
        border: 'border-yellow-200',
      }
    );

    return cards;
  }, [data?.stats, showPayments]);

  if (isLoading && !data) {
    return (
      <div className="admin_homePage admin_home_loading">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin_homePage admin_home_loading">
        <p className="admin_home_error">{error}</p>
        <button type="button" className="admin_home_retry" onClick={() => refresh()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="admin_homePage">
      <div className="admin_home_welcome_row">
        <div className="admin_home_welcome">
          <h1>Welcome, {displayName}</h1>
          {admin?.role ? (
            <span className={getRolePillClass(admin.role)}>{formatAdminRole(admin.role)}</span>
          ) : null}
        </div>
        <AdminDemoToggle />
      </div>

      {appliedUserId && !demoMode && (
        <p className="dashboard_user_filter_note">
          Recent transactions filtered to user <code>{appliedUserId}</code>. Stats and charts remain
          global.
        </p>
      )}

      <section className="stats_section">
        {statCards.length > 0 ? (
          statCards.map((stat) => (
            <div key={stat.key} className={`stats_card ${stat.border}`}>
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

      <div className="content_grid">
        <div className="left_column">
          <div className="card">
            <h2>Recent Transactions</h2>
            <div className="card_list">
              {data?.recentTransactions?.length ? (
                data.recentTransactions.map((tx) => (
                  <Link
                    key={tx.id}
                    href={`/command-center/transactions/${tx.id}`}
                    className="card_item card_item_link"
                  >
                    <div className="card_avatar">{getInitialsFromDisplayName(tx.userName)}</div>
                    <div className="card_content">
                      <p className="card_name">{tx.userName}</p>
                      <p className="card_amount">{formatPrice(tx.amount)}</p>
                    </div>
                    <div className="card_meta">
                      {showInternalTestBadge && tx.isInternalTestAccount && (
                        <span className="pill pill_internal_test" title="Internal test account">
                          Internal test
                        </span>
                      )}
                      <p className="card_time">{formatLastActive(tx.createdAt)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="empty_fallback">No recent transactions</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2>New Users</h2>
            <div className="card_list">
              {data?.newUsers?.length ? (
                data.newUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/command-center/users/${user.id}`}
                    className="card_item card_item_link"
                  >
                    <div className="card_avatar">{getInitialsFromDisplayName(user.fullName)}</div>
                    <div className="card_content">
                      <p className="card_name">{user.fullName}</p>
                    </div>
                    <div className="card_meta">
                      {showInternalTestBadge && user.isInternalTestAccount && (
                        <span className="pill pill_internal_test" title="Internal test account">
                          Internal test
                        </span>
                      )}
                      <p className="card_time">{formatLastActive(user.createdAt)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="empty_fallback">No new users</p>
              )}
            </div>
          </div>
        </div>

        <div className="right_column">
          {canViewFraud && data?.fraudSummary?.visible && (
            <div className="card fraud_dashboard_card">
              <div className="fraud_dashboard_card_header">
                <h2>
                  <FaShieldAlt style={{ marginRight: 8 }} />
                  Fraud Alerts
                </h2>
                <Link href="/command-center/security/fraud-events" className="card_link">
                  View all
                </Link>
              </div>
              <div className="fraud_dashboard_stats">
                <div>
                  <strong>{data.fraudSummary.criticalOpen ?? 0}</strong>
                  <span>Critical open</span>
                </div>
                <div>
                  <strong>{data.fraudSummary.openCount ?? 0}</strong>
                  <span>Open events</span>
                </div>
                <div>
                  <strong>{data.fraudSummary.last24h ?? 0}</strong>
                  <span>Last 24h</span>
                </div>
              </div>
              <div className="card_list">
                {data.fraudSummary.recent?.length ? (
                  data.fraudSummary.recent.map((event) => (
                    <Link
                      key={event.id}
                      href={`/command-center/security/fraud-events?eventId=${event.id}`}
                      className="card_item card_item_link"
                    >
                      <div className="card_content">
                        <p className="card_name">
                          <span className={`pill pill_severity_${event.severity}`}>
                            {event.severity}
                          </span>
                          {event.eventType}
                        </p>
                        <p className="card_amount">{event.message}</p>
                      </div>
                      <div className="card_meta">
                        {event.isInternalTestAccount && (
                          <span className="pill pill_internal_test">Internal test</span>
                        )}
                        <p className="card_time">{formatLastActive(event.createdAt)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="empty_fallback">No recent fraud events</p>
                )}
              </div>
            </div>
          )}

          {showRevenue && (
            <div className="chart_card">
              <h2>Revenue Overview</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: unknown) =>
                      typeof value === 'number' ? formatPrice(value) : String(value || '')
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0064FF"
                    strokeWidth={2}
                    dot={{ fill: '#0064FF' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <button className="view_button" onClick={() => setExpandedChart('revenue')}>
                <FaExpand /> View
              </button>
            </div>
          )}

          <div className="chart_card">
            <h2>User Growth</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#0064FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <button className="view_button" onClick={() => setExpandedChart('userGrowth')}>
              <FaExpand /> View
            </button>
          </div>

          <div className="chart_card">
            <h2>Transaction Volume</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={transactionVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#0064FF"
                  fill="#0064FF"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
            <button className="view_button" onClick={() => setExpandedChart('transactionVolume')}>
              <FaExpand /> View
            </button>
          </div>
        </div>
      </div>

      {expandedChart && (
        <div className="chart_modal" onClick={() => setExpandedChart(null)}>
          <div className="chart_modal_content" onClick={(e) => e.stopPropagation()}>
            <button className="close_modal" onClick={() => setExpandedChart(null)}>
              ✕
            </button>
            {expandedChart === 'revenue' && showRevenue && (
              <>
                <h2>Revenue Overview</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={14} />
                    <YAxis stroke="#6b7280" fontSize={14} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value: unknown) =>
                        typeof value === 'number' ? formatPrice(value) : String(value || '')
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0064FF"
                      strokeWidth={3}
                      dot={{ fill: '#0064FF', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
            {expandedChart === 'userGrowth' && (
              <>
                <h2>User Growth</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={14} />
                    <YAxis stroke="#6b7280" fontSize={14} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="users" fill="#0064FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
            {expandedChart === 'transactionVolume' && (
              <>
                <h2>Transaction Volume</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={transactionVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={14} />
                    <YAxis stroke="#6b7280" fontSize={14} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#0064FF"
                      fill="#0064FF"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      )}
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

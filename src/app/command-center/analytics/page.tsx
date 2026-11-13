'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  FaChartLine,
  FaUsers,
  FaWallet,
  FaCoins,
  FaShoppingCart,
  FaPercentage,
  FaUserPlus,
  FaExpand,
  FaSync,
  FaFilePdf,
  FaFileCsv,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '@/styles/adminAnalytics.css';
import { MetricHelp } from '@/components/admin/ui/MetricHelp';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import { useAdminAnalyticsReports } from '@/hooks/useAdminAnalyticsReports';
import { formatPrice } from '@/utils/FormatPrice';
import { canAccessAnalyticsReports } from '@/utils/adminAnalyticsAccess';
import {
  formatDeltaPct,
  getBuyPowerBalanceStatus,
  getDeltaClass,
} from '@/utils/buyPowerBalanceStatus';
import type { AnalyticsMetricKey } from '@/constants/analyticsMetricGlossary';
import {
  DEFAULT_ANALYTICS_SCOPE,
  type AnalyticsScopeFlags,
} from '@/types/adminAnalyticsReports';

const PRIMARY = '#0064FF';
const GREEN = '#16a34a';
const PIE_COLORS = ['#0064FF', '#16a34a', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

function defaultStartDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 11);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function LabelWithHelp({
  label,
  metricKey,
}: {
  label: string;
  metricKey?: AnalyticsMetricKey;
}) {
  return (
    <span className="stats_header_label">
      <p>{label}</p>
      {metricKey ? <MetricHelp metricKey={metricKey} /> : null}
    </span>
  );
}

function DeltaChip({ deltaPct }: { deltaPct?: number | null }) {
  if (deltaPct == null) return null;
  return (
    <span className={`analytics_delta ${getDeltaClass(deltaPct)}`}>
      {formatDeltaPct(deltaPct)} vs prior period
    </span>
  );
}

function AnalyticsReportsPageInner() {
  const { admin } = useAdminAuth();
  const canAccess = canAccessAnalyticsReports(admin);
  const {
    excludeInternalTest,
    setExcludeInternalTest,
    canToggleInternalTestExclusion,
  } = useAdminAnalytics();

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [appliedRange, setAppliedRange] = useState({
    startDate: defaultStartDate(),
    endDate: defaultEndDate(),
  });
  const [scope, setScope] = useState<AnalyticsScopeFlags>(DEFAULT_ANALYTICS_SCOPE);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isSyncing,
    isExporting,
    error,
    refreshLedger,
    exportReport,
  } = useAdminAnalyticsReports({
    startDate: appliedRange.startDate,
    endDate: appliedRange.endDate,
    scope,
    enabled: canAccess,
  });

  const updateScope = (key: keyof AnalyticsScopeFlags, value: boolean) => {
    setScope((prev) => ({ ...prev, [key]: value }));
  };

  const balanceStatus = useMemo(() => {
    const fromApi = data?.kpis.buyPowerWalletBalance?.status;
    if (fromApi?.className) return fromApi;
    return getBuyPowerBalanceStatus(data?.kpis.buyPowerWalletBalance?.value);
  }, [data]);

  const profitMixData = useMemo(
    () =>
      (data?.charts.profitMix || []).map((row) => ({
        name: row.label,
        value: row.value,
      })),
    [data]
  );

  const paymentMixData = useMemo(
    () =>
      (data?.charts.paymentForMix || []).map((row) => ({
        name: row.paymentFor,
        value: row.count,
        gmv: row.gmv,
      })),
    [data]
  );

  if (!canAccess) {
    return (
      <div className="analytics_page">
        <h1>Analytics & Reports</h1>
        <p className="analytics_subtitle">Super Admin or Finance access required.</p>
      </div>
    );
  }

  const k = data?.kpis;

  const cards = [
    {
      key: 'purchases',
      label: 'Completed purchases',
      metricKey: 'completedPurchases' as const,
      value: k ? k.completedPurchases.value.toLocaleString() : '—',
      delta: k?.completedPurchases.deltaPct,
      icon: <FaShoppingCart className="text-blue-500 text-xl" />,
      border: 'border-blue-200',
      sub: 'Consumer purchase debits',
    },
    {
      key: 'gmv',
      label: 'Fee-bearing GMV',
      metricKey: 'feeBearingGmv' as const,
      value: k ? formatPrice(k.feeBearingGmv.value) : '—',
      delta: k?.feeBearingGmv.deltaPct,
      icon: <FaChartLine className="text-indigo-500 text-xl" />,
      border: 'border-indigo-200',
      sub: 'Spend on fee-charging purchases',
    },
    {
      key: 'sc',
      label: 'Service charges (SC)',
      metricKey: 'sc' as const,
      value: k ? formatPrice(k.serviceCharges.value) : '—',
      delta: k?.serviceCharges.deltaPct,
      icon: <FaCoins className="text-emerald-500 text-xl" />,
      border: 'border-emerald-200',
      sub: k ? `${k.serviceCharges.feeTxs ?? 0} fee txs` : 'BelPower fee profit',
    },
    {
      key: 'commission',
      label: 'BuyPower commissions',
      metricKey: 'bpCommission' as const,
      value: k ? formatPrice(k.buyPowerCommissions.value) : '—',
      delta: k?.buyPowerCommissions.deltaPct,
      icon: <FaCoins className="text-purple-500 text-xl" />,
      border: 'border-purple-200',
      sub: k
        ? `All-time ${formatPrice(k.buyPowerCommissions.allTime ?? 0)}`
        : 'Synced ledger',
    },
    {
      key: 'combined',
      label: 'Combined profit',
      metricKey: 'combinedProfit' as const,
      value: k ? formatPrice(k.combinedProfit.value) : '—',
      delta: k?.combinedProfit.deltaPct,
      icon: <FaChartLine className="text-green-500 text-xl" />,
      border: 'border-green-200',
      sub: 'SC + BuyPower commission',
    },
    {
      key: 'margin',
      label: 'Profit margin',
      metricKey: 'profitMargin' as const,
      value: k ? `${((k.profitMargin.value || 0) * 100).toFixed(2)}%` : '—',
      delta: k?.profitMargin.deltaPct,
      icon: <FaPercentage className="text-cyan-500 text-xl" />,
      border: 'border-cyan-200',
      sub: 'Combined ÷ fee GMV',
    },
    {
      key: 'balance',
      label: 'BuyPower wallet balance',
      metricKey: 'buyPowerWalletBalance' as const,
      value:
        k?.buyPowerWalletBalance.value == null
          ? '—'
          : formatPrice(k.buyPowerWalletBalance.value),
      delta: null,
      icon: <FaWallet className="text-blue-600 text-xl" />,
      border: 'border-blue-200',
      sub: k?.buyPowerWalletBalance.lastUpdated
        ? `Updated ${new Date(k.buyPowerWalletBalance.lastUpdated).toLocaleString()}`
        : 'Live float',
      balanceCard: true,
    },
    {
      key: 'topup',
      label: 'TRANSFER_TOPUP',
      metricKey: 'transferTopup' as const,
      value:
        k?.transferTopup?.available === false
          ? 'Unavailable'
          : k
            ? formatPrice(k.transferTopup.total || 0)
            : '—',
      delta: null,
      icon: <FaWallet className="text-amber-500 text-xl" />,
      border: 'border-amber-200',
      sub:
        k?.transferTopup?.available === false
          ? 'Not in BuyPower history API'
          : 'Period wallet top-ups',
    },
    {
      key: 'refunded',
      label: 'Refunded originals',
      metricKey: 'refundedOriginals' as const,
      value: k?.refundedOriginals
        ? formatPrice(k.refundedOriginals.gmv)
        : '—',
      delta: null,
      icon: <FaCoins className="text-orange-500 text-xl" />,
      border: 'border-orange-200',
      sub: k?.refundedOriginals
        ? `${k.refundedOriginals.count.toLocaleString()} txs · later refunded to wallet`
        : 'Purchase debits later refunded',
    },
    {
      key: 'users',
      label: 'Total users',
      metricKey: 'totalUsers' as const,
      value: k ? k.totalUsers.value.toLocaleString() : '—',
      delta: null,
      icon: <FaUsers className="text-violet-500 text-xl" />,
      border: 'border-violet-200',
      sub: scope.includeDeletedUsers ? 'Includes deleted accounts' : 'Non-deleted accounts',
    },
    {
      key: 'newUsers',
      label: 'New users',
      metricKey: 'newUsers' as const,
      value: k ? k.newUsers.value.toLocaleString() : '—',
      delta: null,
      icon: <FaUserPlus className="text-pink-500 text-xl" />,
      border: 'border-pink-200',
      sub: 'Registered in period',
    },
    {
      key: 'activeBuyers',
      label: 'Active buyers',
      metricKey: 'activeBuyers' as const,
      value: k ? k.activeBuyers.value.toLocaleString() : '—',
      delta: null,
      icon: <FaUsers className="text-teal-500 text-xl" />,
      border: 'border-teal-200',
      sub: 'Buyers with ≥1 purchase',
    },
  ];

  const renderChart = (id: string, title: string, metricKey: AnalyticsMetricKey | undefined, body: ReactNode) => (
    <div className="chart_card" key={id}>
      <div className="chart_card_header">
        <h3>
          {title}
          {metricKey ? <MetricHelp metricKey={metricKey} /> : null}
        </h3>
        <button
          type="button"
          className="analytics_expand_btn"
          aria-label={`Expand ${title}`}
          onClick={() => setExpandedChart(id)}
        >
          <FaExpand />
        </button>
      </div>
      <div style={{ width: '100%', height: 220 }}>{body}</div>
    </div>
  );

  const chartBodies: Record<string, ReactNode> = {
    feeGmv: (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data?.charts.feeGmvByMonth || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatPrice(v)} />
          <Line type="monotone" dataKey="value" name="Fee GMV" stroke={PRIMARY} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
    profit: (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data?.charts.combinedProfitByMonth || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatPrice(v)} />
          <Line type="monotone" dataKey="value" name="Combined profit" stroke={GREEN} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
    purchases: (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data?.charts.purchasesByMonth || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" name="Purchases" fill={PRIMARY} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
    scCommission: (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data?.charts.scVsCommissionByMonth || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatPrice(v)} />
          <Legend />
          <Bar dataKey="sc" name="SC" fill={GREEN} radius={[4, 4, 0, 0]} />
          <Bar dataKey="commission" name="BP commission" fill={PRIMARY} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
    volume: (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data?.charts.transactionVolumeByMonth || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" name="Volume" stroke={PRIMARY} fill="rgba(0,100,255,0.18)" />
        </AreaChart>
      </ResponsiveContainer>
    ),
    profitMix: (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={profitMixData} dataKey="value" nameKey="name" outerRadius={80} label>
            {profitMixData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? GREEN : PRIMARY} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatPrice(v)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    ),
    paymentMix: (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={paymentMixData} dataKey="value" nameKey="name" outerRadius={80} label>
            {paymentMixData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    ),
    userGrowth: (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data?.charts.userGrowth || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="newUsers" name="New users" stroke={PRIMARY} strokeWidth={2} />
          <Line type="monotone" dataKey="cumulativeUsers" name="Cumulative" stroke={GREEN} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    ),
  };

  return (
    <div className="analytics_page">
      <h1>Analytics & Reports</h1>
      <p className="analytics_subtitle">
        Operating metrics for Super Admin and Finance — BelPower SC, BuyPower commissions & float,
        users, and exports. Raise projections stay in offline reports.
      </p>

      <div className="analytics_toolbar">
        <div className="analytics_date_field">
          <label htmlFor="analytics-start">Start</label>
          <input
            id="analytics-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="analytics_date_field">
          <label htmlFor="analytics-end">End</label>
          <input
            id="analytics-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="analytics_btn analytics_btn_primary"
          onClick={() => setAppliedRange({ startDate, endDate })}
        >
          Apply range
        </button>
        <div className="analytics_toolbar_actions">
          <button
            type="button"
            className="analytics_btn"
            disabled={isSyncing}
            onClick={() => void refreshLedger()}
          >
            {isSyncing ? <Loader2 className="inline h-4 w-4 animate-spin" /> : <FaSync className="inline" />}{' '}
            Refresh BuyPower ledger
          </button>
          <button
            type="button"
            className="analytics_btn"
            disabled={!!isExporting}
            onClick={() => void exportReport('pdf')}
          >
            <FaFilePdf className="inline text-red-500" />{' '}
            {isExporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            type="button"
            className="analytics_btn"
            disabled={!!isExporting}
            onClick={() => void exportReport('csv')}
          >
            <FaFileCsv className="inline text-green-600" />{' '}
            {isExporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="analytics_scope_panel">
        <p className="analytics_scope_title">Scope</p>
        <div className="analytics_scope_checks">
          <label className="analytics_scope_check">
            <input
              type="checkbox"
              checked={scope.includeDeletedUsers}
              onChange={(e) => updateScope('includeDeletedUsers', e.target.checked)}
            />
            <span>Include deleted users</span>
            <MetricHelp metricKey="includeDeletedUsers" />
          </label>
          <label className="analytics_scope_check">
            <input
              type="checkbox"
              checked={scope.includePartners}
              onChange={(e) => updateScope('includePartners', e.target.checked)}
            />
            <span>Include partners</span>
            <MetricHelp metricKey="includePartners" />
          </label>
          <label className="analytics_scope_check">
            <input
              type="checkbox"
              checked={scope.includeBusinesses}
              onChange={(e) => updateScope('includeBusinesses', e.target.checked)}
            />
            <span>Include businesses</span>
            <MetricHelp metricKey="includeBusinesses" />
          </label>
          {canToggleInternalTestExclusion ? (
            <label className="analytics_scope_check">
              <input
                type="checkbox"
                checked={excludeInternalTest}
                onChange={(e) => setExcludeInternalTest(e.target.checked)}
              />
              <span>Exclude internal test accounts</span>
              <MetricHelp metricKey="excludeInternalTest" />
            </label>
          ) : null}
          <label className="analytics_scope_check">
            <input
              type="checkbox"
              checked={scope.excludeRefundedOriginals}
              onChange={(e) => updateScope('excludeRefundedOriginals', e.target.checked)}
            />
            <span>Exclude refunded purchase originals</span>
            <MetricHelp metricKey="excludeRefundedOriginals" />
          </label>
        </div>
        {data?.scope?.note ? (
          <p className="analytics_scope_note">{data.scope.note}</p>
        ) : null}
      </div>

      {error ? (
        <div className="admin_alert_danger" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
        </div>
      ) : null}

      <section className="stats_section">
        {isLoading && !data
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="stats_card border-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <div className="stats_bottom">
                  <h2>—</h2>
                  <p>Loading…</p>
                </div>
              </div>
            ))
          : cards.map((card) => {
              const balanceClass =
                card.balanceCard && balanceStatus
                  ? `analytics_card_${balanceStatus.className.replace('analytics_', '')} ${balanceStatus.className}`
                  : '';
              return (
                <div key={card.key} className={`stats_card ${card.border} ${balanceClass}`.trim()}>
                  <div className="stats_header">
                    <LabelWithHelp label={card.label} metricKey={card.metricKey} />
                    {card.icon}
                  </div>
                  <div className="stats_bottom">
                    <h2 className={card.balanceCard ? balanceStatus.className : undefined}>
                      {card.value}
                    </h2>
                    <p>{card.sub}</p>
                    {card.balanceCard ? (
                      <span className="analytics_status_pill">{balanceStatus.label}</span>
                    ) : (
                      <DeltaChip deltaPct={card.delta} />
                    )}
                  </div>
                </div>
              );
            })}
      </section>

      <div className="analytics_section_header">
        <h2>
          Charts
          <MetricHelp metricKey="combinedProfit" />
        </h2>
      </div>

      {!data && !isLoading ? (
        <div className="analytics_empty_card">No analytics data for this range yet.</div>
      ) : (
        <div className="analytics_charts_grid">
          {renderChart('feeGmv', 'Fee-bearing GMV by month', 'feeBearingGmv', chartBodies.feeGmv)}
          {renderChart('profit', 'Combined profit by month', 'combinedProfit', chartBodies.profit)}
          {renderChart('purchases', 'Purchases by month', 'completedPurchases', chartBodies.purchases)}
          {renderChart('scCommission', 'SC vs BuyPower commission', 'sc', chartBodies.scCommission)}
          {renderChart('volume', 'Transaction volume', undefined, chartBodies.volume)}
          {renderChart('profitMix', 'Profit mix', 'profitMargin', chartBodies.profitMix)}
          {renderChart('paymentMix', 'payment_for mix', 'paymentFor', chartBodies.paymentMix)}
          {renderChart('userGrowth', 'User growth', 'userGrowth', chartBodies.userGrowth)}
        </div>
      )}

      <div className="analytics_section_header">
        <h2>Monthly detail</h2>
      </div>

      <div className="analytics_table_wrap">
        <table className="analytics_table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="num">Txs</th>
              <th className="num">
                <span className="th_label">
                  Fee txs <MetricHelp metricKey="feeTxs" />
                </span>
              </th>
              <th className="num">
                <span className="th_label">
                  Fee GMV <MetricHelp metricKey="feeBearingGmv" />
                </span>
              </th>
              <th className="num">
                <span className="th_label">
                  SC <MetricHelp metricKey="sc" />
                </span>
              </th>
              <th className="num">
                <span className="th_label">
                  BP commission <MetricHelp metricKey="bpCommission" />
                </span>
              </th>
              <th className="num">
                <span className="th_label">
                  Combined <MetricHelp metricKey="combinedProfit" />
                </span>
              </th>
              <th className="num">
                <span className="th_label">
                  Margin <MetricHelp metricKey="profitMargin" />
                </span>
              </th>
              <th className="num">MoM</th>
            </tr>
          </thead>
          <tbody>
            {(data?.monthly || []).map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td className="num">{row.txs.toLocaleString()}</td>
                <td className="num">{row.feeTxs.toLocaleString()}</td>
                <td className="num">{formatPrice(row.feeGmv)}</td>
                <td className="num">{formatPrice(row.sc)}</td>
                <td className="num">{formatPrice(row.commission)}</td>
                <td className="num">{formatPrice(row.combined)}</td>
                <td className="num">{`${((row.margin || 0) * 100).toFixed(2)}%`}</td>
                <td className={`num ${getDeltaClass(row.deltas?.combined)}`}>
                  {formatDeltaPct(row.deltas?.combined)}
                </td>
              </tr>
            ))}
            {!data?.monthly?.length && !isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#6b7280' }}>
                  No monthly rows yet — try refreshing the BuyPower ledger.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="analytics_ledger_note">
        BuyPower ledger: {data?.ledger.rowCount ?? 0} rows · last sync{' '}
        {data?.ledger.lastSyncedAt
          ? new Date(data.ledger.lastSyncedAt).toLocaleString()
          : 'never'}
        {data?.ledger.topupsAvailable === false
          ? ' · Top-ups not present in history API'
          : ''}
      </p>

      {expandedChart ? (
        <div className="analytics_modal_backdrop" onClick={() => setExpandedChart(null)}>
          <div className="analytics_modal" onClick={(e) => e.stopPropagation()}>
            <div className="chart_card_header">
              <h3>{expandedChart}</h3>
              <button type="button" className="analytics_btn" onClick={() => setExpandedChart(null)}>
                Close
              </button>
            </div>
            <div style={{ width: '100%', height: 420 }}>{chartBodies[expandedChart]}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AnalyticsReportsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsReportsPageInner />
    </ProtectedRoute>
  );
}

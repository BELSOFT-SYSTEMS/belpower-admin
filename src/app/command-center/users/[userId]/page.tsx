'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminDiscoImage } from '@/components/admin/ui/AdminDiscoImage';
import {
  FaArrowLeft,
  FaUserSlash,
  FaBan,
  FaEnvelope,
  FaExclamationTriangle,
  FaUserCheck,
  FaHome,
  FaWallet,
  FaChartLine,
  FaExchangeAlt,
  FaClock,
  FaShieldAlt,
  FaKey,
  FaMobileAlt,
  FaCheckCircle,
  FaTrash,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminUserDetails.css';
import '@/styles/adminTransactions.css';
import '@/styles/adminShared.css';
import '@/styles/adminAdmins.css';
import { formatPrice } from '@/utils/FormatPrice';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { AdminTransactionsListPanel } from '@/components/admin/transactions/AdminTransactionsListPanel';
import {
  UserQuickActionModal,
  type UserQuickActionType,
} from '@/components/admin/users/UserQuickActionModal';
import { AdminConfirmModal } from '@/components/admin/admins/AdminConfirmModal';
import { ClearSuspicionModal } from '@/components/admin/users/ClearSuspicionModal';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminUserDetail } from '@/hooks/useAdminUserDetail';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import {
  activateUser,
  blockUser,
  clearUserSuspicion,
  deleteUser,
  suspendUser,
} from '@/lib/adminUsers';
import type { AdminMeter, AdminUserDetail } from '@/types/adminUserDetail';
import { formatAdminDate, formatAdminDateTime, formatReviewedAt } from '@/utils/formatAdminDate';
import { formatLastActive } from '@/utils/formatLastActive';
import { formatUserLastActive } from '@/utils/resolveUserLastActive';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';
import {
  canShowClearFlag,
  getDetailActionAvailability,
  getDetailActionTitle,
} from '@/utils/userDetailQuickActions';

const RISK_LABELS = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
} as const;

const REVIEW_STATUS_LABELS = {
  cleared: 'Cleared',
  under_review: 'Under review',
} as const;

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? '';
  const { canAccess } = useAdminAuth();
  const { detail, isLoading, error, errorCode, refresh } = useAdminUserDetail(userId);

  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAction, setPendingAction] = useState<UserQuickActionType | null>(null);
  const [showClearFlag, setShowClearFlag] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!canAccess('users.list')) {
    return (
      <div className="user_details_page">
        <h1>User details</h1>
        <p className="empty_fallback">You do not have access to users.</p>
      </div>
    );
  }

  const openAction = (type: UserQuickActionType) => setPendingAction(type);
  const closeAction = () => {
    if (!isSubmitting) setPendingAction(null);
  };

  const handleMessage = () => {
    if (!detail) return;
    router.push(`/command-center/messages?userId=${encodeURIComponent(detail.id)}`);
  };

  const handleConfirmAction = async (payload: { reason?: string; days?: number }) => {
    if (!detail || !pendingAction) return;

    if (getAdminDemoMode()) {
      toast.success(`Demo: ${detail.fullName} ${pendingAction} action simulated.`);
      setPendingAction(null);
      return;
    }

    setIsSubmitting(true);
    try {
      if (pendingAction === 'block') {
        await blockUser(detail.id, payload.reason);
        toast.success(`${detail.fullName} has been blocked.`);
      } else if (pendingAction === 'suspend') {
        await suspendUser(detail.id, payload);
        toast.success(`${detail.fullName} has been suspended.`);
      } else {
        await activateUser(detail.id);
        toast.success(`${detail.fullName} has been activated.`);
      }

      setPendingAction(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!detail) return;

    if (getAdminDemoMode()) {
      toast.success(`Demo: ${detail.fullName} delete action simulated.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteUser(detail.id);
      toast.success(`${detail.fullName} has been deleted.`);
      router.push('/command-center/users');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSuspicion = async (reason?: string) => {
    if (!detail) return;

    if (getAdminDemoMode()) {
      toast.success(`Demo: suspicion flag clear simulated for ${detail.fullName}.`);
      setShowClearFlag(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await clearUserSuspicion(detail.id, reason);
      toast.success(`Suspicion flag cleared for ${detail.fullName}.`);
      setShowClearFlag(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear flag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCheckMeter = (meter: AdminMeter) => {
    const query = new URLSearchParams({
      meter: meter.meterNumber,
      disco: meter.disco,
      type: meter.meterType,
    });
    router.push(`/command-center/check-meter?${query.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="user_details_page">
        <div className="users_page_loading" style={{ padding: '4rem 0' }}>
          <Loader2 className="animate-spin" size={32} aria-hidden />
          <p>Loading user…</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    const isNotFound = errorCode === 'NOT_FOUND';
    return (
      <div className="user_details_page">
        <button
          type="button"
          className="receipt_back"
          onClick={() => router.push('/command-center/users')}
        >
          <FaArrowLeft /> Back to users
        </button>
        <div className="admin_panel_card not_found">
          <p>{isNotFound ? 'User not found.' : error ?? 'Failed to load user.'}</p>
          {!isNotFound && errorCode !== 'FORBIDDEN' && (
            <button type="button" className="users_page_retry" onClick={refresh}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <UserDetailContent
      detail={detail}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onMessage={handleMessage}
      onOpenAction={openAction}
      onOpenCheckMeter={openCheckMeter}
      onOpenClearFlag={() => setShowClearFlag(true)}
      onOpenDeleteUser={() => setShowDeleteUser(true)}
      pendingAction={pendingAction}
      showClearFlag={showClearFlag}
      showDeleteUser={showDeleteUser}
      isSubmitting={isSubmitting}
      onCloseAction={closeAction}
      onConfirmAction={handleConfirmAction}
      onCloseClearFlag={() => {
        if (!isSubmitting) setShowClearFlag(false);
      }}
      onConfirmClearFlag={handleClearSuspicion}
      onCloseDeleteUser={() => {
        if (!isSubmitting) setShowDeleteUser(false);
      }}
      onConfirmDeleteUser={handleDeleteUser}
    />
  );
}

type UserDetailContentProps = {
  detail: AdminUserDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMessage: () => void;
  onOpenAction: (type: UserQuickActionType) => void;
  onOpenCheckMeter: (meter: AdminMeter) => void;
  onOpenClearFlag: () => void;
  onOpenDeleteUser: () => void;
  pendingAction: UserQuickActionType | null;
  showClearFlag: boolean;
  showDeleteUser: boolean;
  isSubmitting: boolean;
  onCloseAction: () => void;
  onConfirmAction: (payload: { reason?: string; days?: number }) => void;
  onCloseClearFlag: () => void;
  onConfirmClearFlag: (reason?: string) => void;
  onCloseDeleteUser: () => void;
  onConfirmDeleteUser: () => void;
};

function UserDetailContent({
  detail,
  activeTab,
  onTabChange,
  onMessage,
  onOpenAction,
  onOpenCheckMeter,
  onOpenClearFlag,
  onOpenDeleteUser,
  pendingAction,
  showClearFlag,
  showDeleteUser,
  isSubmitting,
  onCloseAction,
  onConfirmAction,
  onCloseClearFlag,
  onConfirmClearFlag,
  onCloseDeleteUser,
  onConfirmDeleteUser,
}: UserDetailContentProps) {
  const router = useRouter();
  const { canAccess } = useAdminAuth();
  const { quickActions, displayStatus } = detail;
  const actions = getDetailActionAvailability(displayStatus);

  const suspiciousTxnCount = detail.suspiciousTransactionCount;
  const suspiciousTransactions = detail.transactions.filter((t) => t.isSuspicious);
  const savedMetersOnly = detail.savedMeters.filter((m) => !m.isPrimary);
  const [transactionsTabCount, setTransactionsTabCount] = useState(
    detail.stats.transactionCount
  );

  useEffect(() => {
    setTransactionsTabCount(detail.stats.transactionCount);
  }, [detail.id, detail.stats.transactionCount]);
  const meter = detail.primaryMeter;
  const { security } = detail;

  const detailStats = [
    {
      icon: <FaWallet className="text-blue-500 text-2xl" />,
      label: 'Wallet balance',
      value: formatPrice(detail.stats.walletBalance),
      border: 'border-blue-200',
    },
    {
      icon: <FaChartLine className="text-green-500 text-2xl" />,
      label: 'Highest transaction',
      value:
        detail.stats.highestTransactionAmount != null
          ? formatPrice(detail.stats.highestTransactionAmount)
          : '—',
      border: 'border-green-200',
    },
    {
      icon: <FaExchangeAlt className="text-purple-500 text-2xl" />,
      label: 'Last transaction',
      value:
        detail.stats.lastTransactionAmount != null
          ? formatPrice(detail.stats.lastTransactionAmount)
          : '—',
      border: 'border-purple-200',
    },
    {
      icon: <FaClock className="text-yellow-500 text-2xl" />,
      label: 'Last login',
      value: formatAdminDateTime(detail.lastLoginAt),
      border: 'border-yellow-200',
      compact: true,
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'transactions',
      label: 'Transactions',
      badge: transactionsTabCount > 0 ? transactionsTabCount : undefined,
    },
    { id: 'meters', label: 'Meters', badge: savedMetersOnly.length },
    { id: 'sessions', label: 'Sessions', badge: detail.sessions.length },
    { id: 'logs', label: 'Activity logs' },
    {
      id: 'security',
      label: 'Security',
      badge: detail.suspiciousActivity ? '!' : undefined,
    },
  ];

  const renderHeaderActions = () =>
    quickActions.message ? (
      <button
        type="button"
        className="action_message"
        onClick={onMessage}
        disabled={isSubmitting}
      >
        <FaEnvelope /> Message
      </button>
    ) : null;

  const isDeleted = displayStatus === 'deleted';

  const renderSecurityReviewActions = () => {
    if (isDeleted) return null;

    return (
    <>
      {quickActions.suspend && (
        <button
          type="button"
          className="security_action_btn action_suspend"
          title={getDetailActionTitle('suspend', displayStatus)}
          onClick={() => {
            if (isSubmitting || !actions.canSuspend) return;
            onOpenAction('suspend');
          }}
          disabled={isSubmitting || !actions.canSuspend}
          aria-disabled={isSubmitting || !actions.canSuspend}
        >
          <FaUserSlash /> Suspend
        </button>
      )}
      {quickActions.block && (
        <button
          type="button"
          className="security_action_btn action_block"
          title={getDetailActionTitle('block', displayStatus)}
          onClick={() => {
            if (isSubmitting || !actions.canBlock) return;
            onOpenAction('block');
          }}
          disabled={isSubmitting || !actions.canBlock}
          aria-disabled={isSubmitting || !actions.canBlock}
        >
          <FaBan /> Block account
        </button>
      )}
      {canShowClearFlag(detail) && (
        <button
          type="button"
          className="security_action_btn action_activate"
          onClick={() => {
            if (isSubmitting) return;
            onOpenClearFlag();
          }}
          disabled={isSubmitting}
        >
          <FaCheckCircle /> Clear flag
        </button>
      )}
      {quickActions.activate && actions.canActivate && (
        <button
          type="button"
          className="security_action_btn action_activate"
          title={getDetailActionTitle('activate', displayStatus)}
          onClick={() => {
            if (isSubmitting) return;
            onOpenAction('activate');
          }}
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          <FaUserCheck /> Activate
        </button>
      )}
      {quickActions.delete && (
        <button
          type="button"
          className="security_action_btn action_delete"
          title="Delete this user"
          onClick={onOpenDeleteUser}
          disabled={isSubmitting}
        >
          <FaTrash /> Delete
        </button>
      )}
    </>
    );
  };

  return (
    <div className="user_details_page">
      <button
        type="button"
        className="receipt_back"
        onClick={() => router.push('/command-center/users')}
      >
        <FaArrowLeft /> Back to users
      </button>

      {isDeleted && (
        <div className="admin_alert admin_alert_warning">
          <FaTrash />
          <div>
            <strong>Deleted account</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              This user was soft-deleted
              {detail.deletedAt ? ` on ${formatAdminDateTime(detail.deletedAt)}` : ''}. Account
              actions are disabled.
            </p>
          </div>
        </div>
      )}

      {detail.suspiciousActivity && !isDeleted && (
        <div className="admin_alert admin_alert_warning">
          <FaExclamationTriangle />
          <div>
            <strong>Suspicious user</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              This account has been flagged for review. {suspiciousTxnCount} suspicious
              transaction(s) on record.
            </p>
          </div>
        </div>
      )}

      <header className="profile_header">
        <div className="profile_main">
          <div
            className="admin_user_avatar_initials"
            aria-hidden
            style={{ backgroundColor: getAvatarBackground(detail.id) }}
          >
            {getUserInitials(detail.firstName, detail.lastName)}
          </div>
          <div>
            <h1>{detail.fullName}</h1>
            <p>{detail.email}</p>
            <p>{detail.phone ?? '—'}</p>
            <span className={`pill pill_${detail.displayStatus}`}>{detail.displayStatus}</span>
            {detail.isInternalTestAccount && (
              <span className="pill pill_internal_test">Internal test</span>
            )}
            {detail.suspiciousActivity && (
              <span className="pill pill_fraud">Suspicious activity</span>
            )}
          </div>
        </div>
        <div className="profile_actions">{renderHeaderActions()}</div>
      </header>

      <section className="user_detail_stats_section stats_section">
        {detailStats.map((stat, index) => (
          <div key={index} className={`stats_card ${stat.border}`}>
            <div className="stats_header">
              <p>{stat.label}</p>
              {stat.icon}
            </div>
            <div className="stats_bottom">
              <h2 className={stat.compact ? 'stat_value_compact' : ''}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </section>

      <div className="admin_panel_card tabs_container">
        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />

        {activeTab === 'overview' && (
          <div className="tab_panel overview_tab">
            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Account overview</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">User ID</span>
                  <span className="overview_value">{detail.id}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Joined</span>
                  <span className="overview_value">{formatAdminDate(detail.joinedAt)}</span>
                </div>
                {isDeleted && (
                  <div className="overview_field">
                    <span className="overview_label">Deleted</span>
                    <span className="overview_value">
                      {formatAdminDateTime(detail.deletedAt)}
                    </span>
                  </div>
                )}
                <div className="overview_field">
                  <span className="overview_label">Last active</span>
                  <span className="overview_value">{formatUserLastActive(detail)}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Email</span>
                  <span className="overview_value">{detail.email}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Phone</span>
                  <span className="overview_value">{detail.phone ?? '—'}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Email verified</span>
                  <span className="overview_value">
                    {detail.emailVerified ? (
                      <span className="pill pill_success">Verified</span>
                    ) : (
                      'No'
                    )}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Phone verified</span>
                  <span className="overview_value">
                    {detail.phoneVerified ? (
                      <span className="pill pill_success">Verified</span>
                    ) : (
                      'No'
                    )}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Total spent</span>
                  <span className="overview_value overview_value_emphasis">
                    {formatPrice(detail.stats.totalSpent)}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Transactions</span>
                  <span className="overview_value">{detail.stats.transactionCount}</span>
                </div>
              </div>
            </section>

            {meter ? (
              <section className="detail_panel my_meter_panel">
                <div className="my_meter_header">
                  <div className="my_meter_title_row">
                    <FaHome className="my_meter_home_icon" aria-hidden />
                    <h2>My Meter</h2>
                    <span className="meter_badge meter_badge_primary">Primary</span>
                  </div>
                </div>

                <div className="my_meter_disco_row">
                  <div className="my_meter_disco_icon">
                    <AdminDiscoImage disco={meter.disco} width={56} height={56} />
                  </div>
                  <div>
                    <p className="my_meter_disco_label">Disco</p>
                    <p className="my_meter_disco_name">{getDiscoDisplayName(meter.disco)}</p>
                    <p className="my_meter_disco_code">{meter.disco}</p>
                  </div>
                </div>

                <div className="my_meter_details_grid">
                  <div className="my_meter_detail_item">
                    <span className="overview_label">Type</span>
                    <span className="overview_value meter_type_badge">{meter.meterType}</span>
                  </div>
                  <div className="my_meter_detail_item">
                    <span className="overview_label">Status</span>
                    <span className="overview_value">
                      {meter.isVerified ? (
                        <span className="pill pill_success">Verified</span>
                      ) : (
                        <span className="pill pill_pending">Unverified</span>
                      )}
                    </span>
                  </div>
                  <div className="my_meter_detail_item my_meter_detail_full">
                    <span className="overview_label">Customer</span>
                    <span className="overview_value">{meter.customerName}</span>
                  </div>
                  <div className="my_meter_detail_item my_meter_detail_full">
                    <span className="overview_label">Meter number</span>
                    <span className="overview_value meter_number_mono">{meter.meterNumber}</span>
                  </div>
                  <div className="my_meter_detail_item my_meter_detail_full">
                    <span className="overview_label">Address</span>
                    <span className="overview_value">{meter.address}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn_verify_meter"
                  onClick={() => onOpenCheckMeter(meter)}
                >
                  Verify Meter
                </button>
              </section>
            ) : (
              <section className="detail_panel my_meter_panel">
                <p className="empty_fallback">No primary meter on file.</p>
              </section>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="tab_panel user_txn_tab_panel">
            <div className="tab_hint_row">
              <p className="tab_hint">
                Live transaction history with search, filters, and quick actions.
              </p>
              {canAccess('transactions.list') && (
                <div className="tab_hint_links">
                  <Link
                    href={`/command-center/transactions?userId=${encodeURIComponent(detail.id)}`}
                    className="tab_hint_link"
                  >
                    Open in transactions
                  </Link>
                </div>
              )}
            </div>
            <AdminTransactionsListPanel
              userId={detail.id}
              showUser={false}
              enabled
              listTitle="User transactions"
              searchPlaceholder="Search reference, provider…"
              className="user_txn_tab_panel"
              isInternalTestAccount={detail.isInternalTestAccount}
              onPaginationTotalChange={setTransactionsTabCount}
            />
          </div>
        )}

        {activeTab === 'meters' && (
          <div className="tab_panel meters_tab">
            {savedMetersOnly.length > 0 ? (
              <div className="meters_tab_list">
                {savedMetersOnly.map((savedMeter) => (
                  <article key={savedMeter.id} className="meter_card_compact">
                    <div className="meter_card_compact_header">
                      <div className="meter_card_compact_disco">
                        <div className="meter_card_compact_disco_icon">
                          <AdminDiscoImage disco={savedMeter.disco} width={36} height={36} />
                        </div>
                        <div className="meter_card_compact_disco_text">
                          <h3>{getDiscoDisplayName(savedMeter.disco)}</h3>
                          <span className="meter_card_compact_disco_code">
                            {savedMeter.disco}
                          </span>
                        </div>
                      </div>
                      <div className="meter_card_compact_header_meta">
                        <span className="meter_card_compact_type">{savedMeter.meterType}</span>
                        {savedMeter.isVerified ? (
                          <span className="pill pill_success pill_compact">Verified</span>
                        ) : (
                          <span className="pill pill_pending pill_compact">Unverified</span>
                        )}
                      </div>
                    </div>

                    <div className="meter_card_compact_fields">
                      <div className="meter_card_compact_field">
                        <span className="meter_card_compact_label">Customer</span>
                        <span className="meter_card_compact_value">{savedMeter.customerName}</span>
                      </div>
                      <div className="meter_card_compact_field">
                        <span className="meter_card_compact_label">Meter number</span>
                        <span className="meter_card_compact_value meter_number_mono">
                          {savedMeter.meterNumber}
                        </span>
                      </div>
                      <div className="meter_card_compact_field meter_card_compact_field_full">
                        <span className="meter_card_compact_label">Address</span>
                        <span
                          className="meter_card_compact_value"
                          title={savedMeter.address}
                        >
                          {savedMeter.address}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn_verify_meter_compact"
                      onClick={() => onOpenCheckMeter(savedMeter)}
                    >
                      Verify Meter
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty_fallback">
                No additional saved meters. The primary meter is shown on Overview.
              </p>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="tab_panel">
            {detail.sessions.length > 0 ? (
              <table className="admin_data_table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>IP</th>
                    <th>Location</th>
                    <th>Last active</th>
                    <th>Current</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.device}</td>
                      <td>{s.ip}</td>
                      <td>{s.location ?? '—'}</td>
                      <td>{formatLastActive(s.lastActiveAt)}</td>
                      <td>{s.isCurrent ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty_fallback">No sessions on record.</p>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="tab_panel">
            {detail.logs.length > 0 ? (
              <table className="admin_data_table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Detail</th>
                    <th>Time</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>{log.detail}</td>
                      <td>{formatAdminDateTime(log.createdAt)}</td>
                      <td>{log.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty_fallback">No activity logs.</p>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="tab_panel security_tab">
            <div className={`security_risk_banner security_risk_${security.riskLevel}`}>
              <div className="security_risk_icon" aria-hidden>
                <FaShieldAlt />
              </div>
              <div className="security_risk_copy">
                <h3>{RISK_LABELS[security.riskLevel]}</h3>
                <p>
                  {detail.suspiciousActivity
                    ? `Account flagged for review. ${suspiciousTxnCount} suspicious transaction(s) on record.`
                    : suspiciousTxnCount > 0
                      ? `${suspiciousTxnCount} transaction(s) flagged; user profile is not marked suspicious.`
                      : 'No active fraud flags on this account.'}
                </p>
                <span className="security_risk_meta">
                  Last reviewed: {formatReviewedAt(security.lastReviewedAt, security.lastReviewedBy)}
                </span>
              </div>
              <span
                className={`pill ${
                  security.reviewStatus === 'cleared' ? 'pill_success' : 'pill_pending'
                }`}
              >
                {REVIEW_STATUS_LABELS[security.reviewStatus]}
              </span>
            </div>

            <div className="security_metrics_grid">
              <div className="security_metric_card">
                <span className="security_metric_label">Account status</span>
                <span className={`pill pill_${detail.displayStatus}`}>{detail.displayStatus}</span>
              </div>
              <div className="security_metric_card">
                <span className="security_metric_label">Flagged transactions</span>
                <strong className="security_metric_value">{suspiciousTxnCount}</strong>
              </div>
              <div className="security_metric_card">
                <span className="security_metric_label">Failed logins (30d)</span>
                <strong
                  className={`security_metric_value${security.failedLoginAttempts > 0 ? ' security_metric_warn' : ''}`}
                >
                  {security.failedLoginAttempts}
                </strong>
              </div>
              <div className="security_metric_card">
                <span className="security_metric_label">Suspicious user</span>
                <strong className="security_metric_value">
                  {detail.suspiciousActivity ? 'Yes' : 'No'}
                </strong>
              </div>
            </div>

            <section className="detail_panel security_section">
              <h3 className="security_section_title">Account protection</h3>
              <div className="security_checks_grid">
                <div className="security_check_item">
                  <span className="security_check_icon security_check_ok" aria-hidden>
                    <FaCheckCircle />
                  </span>
                  <div>
                    <span className="security_check_label">Email verified</span>
                    <span className="security_check_value">
                      {detail.emailVerified ? 'Verified' : 'Not verified'}
                    </span>
                  </div>
                  {detail.emailVerified ? (
                    <span className="pill pill_success pill_compact">OK</span>
                  ) : (
                    <span className="pill pill_pending pill_compact">Pending</span>
                  )}
                </div>
                <div className="security_check_item">
                  <span
                    className={`security_check_icon${detail.phoneVerified ? ' security_check_ok' : ' security_check_warn'}`}
                    aria-hidden
                  >
                    {detail.phoneVerified ? <FaCheckCircle /> : <FaExclamationTriangle />}
                  </span>
                  <div>
                    <span className="security_check_label">Phone verified</span>
                    <span className="security_check_value">
                      {detail.phoneVerified ? (detail.phone ?? 'Verified') : 'Not verified'}
                    </span>
                  </div>
                  {detail.phoneVerified ? (
                    <span className="pill pill_success pill_compact">OK</span>
                  ) : (
                    <span className="pill pill_pending pill_compact">Pending</span>
                  )}
                </div>
                <div className="security_check_item">
                  <span
                    className={`security_check_icon${security.twoFactorEnabled ? ' security_check_ok' : ' security_check_warn'}`}
                    aria-hidden
                  >
                    <FaMobileAlt />
                  </span>
                  <div>
                    <span className="security_check_label">Two-factor auth</span>
                    <span className="security_check_value">
                      {security.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                    </span>
                  </div>
                  {security.twoFactorEnabled ? (
                    <span className="pill pill_success pill_compact">On</span>
                  ) : (
                    <span className="pill pill_failed pill_compact">Off</span>
                  )}
                </div>
                <div className="security_check_item">
                  <span className="security_check_icon security_check_ok" aria-hidden>
                    <FaKey />
                  </span>
                  <div>
                    <span className="security_check_label">Password</span>
                    <span className="security_check_value">
                      {security.lastPasswordChangeAt
                        ? `Last changed ${formatAdminDate(security.lastPasswordChangeAt)}`
                        : 'No change recorded'}
                    </span>
                  </div>
                  <span className="pill pill_success pill_compact">OK</span>
                </div>
              </div>
            </section>

            <section className="detail_panel security_section">
              <h3 className="security_section_title">Flagged transactions</h3>
              {suspiciousTransactions.length > 0 ? (
                <div className="security_flagged_list">
                  {suspiciousTransactions.map((tx) => (
                    <Link
                      key={tx.id}
                      href={`/command-center/transactions/${tx.id}`}
                      className="security_flagged_row"
                    >
                      <div className="security_flagged_main">
                        <span className="security_flagged_ref">{tx.reference}</span>
                        <span className="security_flagged_reason">
                          {tx.fraudReason ?? 'Flagged by fraud detection'}
                        </span>
                      </div>
                      <div className="security_flagged_meta">
                        <span className="security_flagged_amount">
                          {formatPrice(tx.totalAmount)}
                        </span>
                        <span className="pill pill_fraud pill_compact">Flagged</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="security_empty_state">
                  <FaCheckCircle className="security_empty_icon" aria-hidden />
                  <p>No flagged transactions for this user.</p>
                </div>
              )}
            </section>

            <section className="detail_panel security_section security_actions_section">
              <h3 className="security_section_title">Admin review</h3>
              <div className="security_admin_actions">
                {renderSecurityReviewActions()}
              </div>
            </section>
          </div>
        )}
      </div>

      <UserQuickActionModal
        open={pendingAction !== null}
        action={pendingAction}
        userName={detail.fullName}
        isSubmitting={isSubmitting}
        onClose={onCloseAction}
        onConfirm={onConfirmAction}
      />

      <ClearSuspicionModal
        open={showClearFlag}
        userName={detail.fullName}
        isSubmitting={isSubmitting}
        onClose={onCloseClearFlag}
        onConfirm={onConfirmClearFlag}
      />

      <AdminConfirmModal
        open={showDeleteUser}
        title="Delete user"
        message={`Remove ${detail.fullName}? Their account will be marked as deleted and they will lose access to BelPower.`}
        confirmLabel="Delete user"
        danger
        onClose={onCloseDeleteUser}
        onConfirm={onConfirmDeleteUser}
      />
    </div>
  );
}

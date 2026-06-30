'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FaHandshake,
  FaBan,
  FaUserCheck,
  FaUserSlash,
  FaExclamationTriangle,
  FaUnlock,
  FaWallet,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaExchangeAlt,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminUserDetails.css';
import '@/styles/adminTransactions.css';
import '@/styles/adminPartners.css';
import '@/styles/adminShared.css';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { AdminBackButton } from '@/components/admin/ui/AdminBackButton';
import { AdminCopyableValue } from '@/components/admin/ui/AdminCopyableValue';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import { AdminTransactionsListPanel } from '@/components/admin/transactions/AdminTransactionsListPanel';
import { PartnerApiKeysAdminPanel } from '@/components/admin/partners/PartnerApiKeysAdminPanel';
import { ManualPartnerWalletCreditPanel } from '@/components/admin/partners/walletCredit/ManualPartnerWalletCreditPanel';
import { PartnerDepositRequestsPanel } from '@/components/admin/partners/walletCredit/PartnerDepositRequestsPanel';
import {
  PartnerQuickActionModal,
  type PartnerQuickActionType,
} from '@/components/admin/partners/PartnerQuickActionModal';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  approvePartner,
  blockPartner,
  deactivatePartner,
  getPartnerDetail,
  rejectPartner,
  reopenPartnerForReview,
  unblockPartner,
  unblockPartnerRefunds,
} from '@/lib/adminPartners';
import type { PartnerDetail } from '@/types/adminPartners';
import { buildPartnerDetailReturn } from '@/utils/adminReturnNavigation';
import { formatAdminDate, formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import { getPartnerAvatarBackground, getPartnerInitials } from '@/utils/partnerAvatar';
import {
  getPartnerDisplayName,
  getPartnerQuickActionAvailability,
  getPartnerQuickActionDisabledTitle,
  partnerStatusClass,
  formatPartnerStatusLabel,
} from '@/utils/partnerQuickActionAvailability';

type PartnerTab = 'overview' | 'transactions' | 'api' | 'wallet-credit';

export default function PartnerDetailPage() {
  const params = useParams<{ partnerId: string }>();
  const partnerId = params.partnerId;
  const { canAccess } = useAdminAuth();
  const canView = canAccess('partners.detail');

  const [activeTab, setActiveTab] = useState<PartnerTab>('overview');
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PartnerQuickActionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionsTabCount, setTransactionsTabCount] = useState(0);

  const refresh = async () => {
    const data = await getPartnerDetail(partnerId);
    setPartner(data);
  };

  useEffect(() => {
    if (!canView || !partnerId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPartnerDetail(partnerId);
        if (!cancelled) setPartner(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load partner');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [canView, partnerId]);

  const handleConfirmAction = async (payload: { note?: string; reason?: string }) => {
    if (!partner || !pendingAction) return;

    setIsSubmitting(true);

    try {
      if (pendingAction === 'approve') {
        await approvePartner({ partnerId: partner.id, note: payload.note });
        toast.success('Partner approved successfully');
      } else if (pendingAction === 'reject') {
        await rejectPartner({
          partnerId: partner.id,
          reason: payload.reason || 'Application rejected',
        });
        toast.success('Partner rejected');
      } else if (pendingAction === 'reopenReview') {
        await reopenPartnerForReview({ partnerId: partner.id, note: payload.note });
        toast.success('Partner application reopened for review');
      } else if (pendingAction === 'block') {
        await blockPartner({ partnerId: partner.id, reason: payload.reason });
        toast.success('Partner blocked');
      } else if (pendingAction === 'unblock') {
        await unblockPartner(partner.id);
        toast.success('Partner unblocked');
      } else if (pendingAction === 'deactivate') {
        await deactivatePartner({ partnerId: partner.id, reason: payload.reason });
        toast.success('Partner deactivated');
      } else if (pendingAction === 'refundsUnblock') {
        await unblockPartnerRefunds(partner.id, payload.note);
        toast.success('Partner refunds unblocked');
      }

      setPendingAction(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canView) {
    return (
      <div className="user_details_page partner_details_page">
        <h1>Partner detail</h1>
        <p className="empty_fallback">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="user_details_page partner_details_page">
        <AdminBackButton defaultHref="/command-center/partners" defaultLabel="Back to partners" />
        <div className="users_page_loading" style={{ padding: '4rem 0' }}>
          <Loader2 className="animate-spin" size={32} aria-hidden />
          <p>Loading partner…</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="user_details_page partner_details_page">
        <AdminBackButton defaultHref="/command-center/partners" defaultLabel="Back to partners" />
        <div className="admin_panel_card not_found">
          <p>{error || 'Partner not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <PartnerDetailContent
      partner={partner}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pendingAction={pendingAction}
      isSubmitting={isSubmitting}
      transactionsTabCount={transactionsTabCount}
      onOpenAction={setPendingAction}
      onCloseAction={() => {
        if (!isSubmitting) setPendingAction(null);
      }}
      onConfirmAction={handleConfirmAction}
      onTransactionsCountChange={setTransactionsTabCount}
      onRefresh={() => void refresh()}
    />
  );
}

type PartnerDetailContentProps = {
  partner: PartnerDetail;
  activeTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
  pendingAction: PartnerQuickActionType | null;
  isSubmitting: boolean;
  transactionsTabCount: number;
  onOpenAction: (action: PartnerQuickActionType) => void;
  onCloseAction: () => void;
  onConfirmAction: (payload: { note?: string; reason?: string }) => void;
  onTransactionsCountChange: (count: number) => void;
  onRefresh: () => void;
};

function PartnerDetailContent({
  partner,
  activeTab,
  onTabChange,
  pendingAction,
  isSubmitting,
  transactionsTabCount,
  onOpenAction,
  onCloseAction,
  onConfirmAction,
  onTransactionsCountChange,
  onRefresh,
}: PartnerDetailContentProps) {
  const { canAccess } = useAdminAuth();
  const displayName = getPartnerDisplayName(partner);
  const actions = getPartnerQuickActionAvailability(partner);
  const quickActions = partner.quickActions ?? {
    approve: false,
    reject: false,
    reopenReview: false,
    block: false,
    unblock: false,
    deactivate: false,
    walletCreditManual: false,
    refundsUnblock: false,
  };
  const canCreditWallet =
    canAccess('partners.wallet_credit_manual') || quickActions.walletCreditManual;
  const canManage = canAccess('partners.approve') || quickActions.approve;

  const transactionsTabReturn = useMemo(
    () => buildPartnerDetailReturn(partner.id, displayName, { tab: 'transactions' }),
    [partner.id, displayName]
  );

  const detailStats = [
    {
      icon: <FaWallet className="text-blue-500 text-2xl" />,
      label: 'Wallet balance',
      value: formatPrice(partner.walletBalance),
      border: 'border-blue-200',
    },
    {
      icon: <FaExchangeAlt className="text-indigo-500 text-2xl" />,
      label: 'Transaction total',
      value: formatPrice(partner.transactionTotal ?? 0),
      border: 'border-indigo-200',
    },
    {
      icon: <FaHandshake className="text-green-500 text-2xl" />,
      label: 'Account status',
      value: formatPartnerStatusLabel(partner.status),
      border: 'border-green-200',
    },
    {
      icon: <FaClock className="text-yellow-500 text-2xl" />,
      label: 'Last login',
      value: partner.lastLoginAt ? formatAdminDateTime(partner.lastLoginAt) : 'Never',
      border: 'border-yellow-200',
      compact: true,
    },
    {
      icon: <FaKey className="text-purple-500 text-2xl" />,
      label: 'API keys',
      value: String(partner.apiKeys?.length ?? 0),
      border: 'border-purple-200',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'transactions',
      label: 'Transactions',
      badge: transactionsTabCount > 0 ? transactionsTabCount : undefined,
    },
    { id: 'api', label: 'API keys', badge: partner.apiKeys?.length || undefined },
    ...(canCreditWallet ? [{ id: 'wallet-credit', label: 'Wallet credit' }] : []),
  ];

  const renderPartnerAdminReviewActions = () => (
    <>
      {quickActions.approve ? (
        <button
          type="button"
          className="security_action_btn action_activate"
          title={getPartnerQuickActionDisabledTitle('approve', partner)}
          disabled={isSubmitting || !actions.canApprove}
          aria-disabled={isSubmitting || !actions.canApprove}
          onClick={() => {
            if (isSubmitting || !actions.canApprove) return;
            onOpenAction('approve');
          }}
        >
          <FaCheckCircle /> Approve application
        </button>
      ) : null}
      {quickActions.reject ? (
        <button
          type="button"
          className="security_action_btn action_block"
          title={getPartnerQuickActionDisabledTitle('reject', partner)}
          disabled={isSubmitting || !actions.canReject}
          aria-disabled={isSubmitting || !actions.canReject}
          onClick={() => {
            if (isSubmitting || !actions.canReject) return;
            onOpenAction('reject');
          }}
        >
          <FaTimesCircle /> Reject application
        </button>
      ) : null}
      {quickActions.reopenReview ? (
        <button
          type="button"
          className="security_action_btn action_message"
          title={getPartnerQuickActionDisabledTitle('reopenReview', partner)}
          disabled={isSubmitting || !actions.canReopenReview}
          aria-disabled={isSubmitting || !actions.canReopenReview}
          onClick={() => {
            if (isSubmitting || !actions.canReopenReview) return;
            onOpenAction('reopenReview');
          }}
        >
          <FaClock /> Reopen for review
        </button>
      ) : null}
      {quickActions.refundsUnblock ? (
        <button
          type="button"
          className="security_action_btn action_refunds_unblock"
          title={getPartnerQuickActionDisabledTitle('refundsUnblock', partner)}
          disabled={isSubmitting || !actions.canUnblockRefunds}
          aria-disabled={isSubmitting || !actions.canUnblockRefunds}
          onClick={() => {
            if (isSubmitting || !actions.canUnblockRefunds) return;
            onOpenAction('refundsUnblock');
          }}
        >
          <FaUnlock /> Unblock refunds
        </button>
      ) : null}
      {quickActions.block ? (
        <button
          type="button"
          className="security_action_btn action_block"
          title={getPartnerQuickActionDisabledTitle('block', partner)}
          disabled={isSubmitting || !actions.canBlock}
          aria-disabled={isSubmitting || !actions.canBlock}
          onClick={() => {
            if (isSubmitting || !actions.canBlock) return;
            onOpenAction('block');
          }}
        >
          <FaBan /> Block partner
        </button>
      ) : null}
      {quickActions.unblock ? (
        <button
          type="button"
          className="security_action_btn action_activate"
          title={getPartnerQuickActionDisabledTitle('unblock', partner)}
          disabled={isSubmitting || !actions.canUnblock}
          aria-disabled={isSubmitting || !actions.canUnblock}
          onClick={() => {
            if (isSubmitting || !actions.canUnblock) return;
            onOpenAction('unblock');
          }}
        >
          <FaUserCheck /> Unblock partner
        </button>
      ) : null}
      {quickActions.deactivate ? (
        <button
          type="button"
          className="security_action_btn action_suspend"
          title={getPartnerQuickActionDisabledTitle('deactivate', partner)}
          disabled={isSubmitting || !actions.canDeactivate}
          aria-disabled={isSubmitting || !actions.canDeactivate}
          onClick={() => {
            if (isSubmitting || !actions.canDeactivate) return;
            onOpenAction('deactivate');
          }}
        >
          <FaUserSlash /> Deactivate partner
        </button>
      ) : null}
    </>
  );

  const hasAdminReviewActions =
    quickActions.approve ||
    quickActions.reject ||
    quickActions.reopenReview ||
    quickActions.refundsUnblock ||
    quickActions.block ||
    quickActions.unblock ||
    quickActions.deactivate;

  return (
    <div className="user_details_page partner_details_page">
      <AdminBackButton defaultHref="/command-center/partners" defaultLabel="Back to partners" />

      <header className="profile_header">
        <div className="profile_main">
          <div
            className="admin_user_avatar_initials"
            aria-hidden
            style={{ backgroundColor: getPartnerAvatarBackground(partner.id) }}
          >
            {getPartnerInitials(partner)}
          </div>
          <div>
            <h1>{displayName}</h1>
            <p>
              {partner.agentFullName}
              {partner.tradingName ? ` · ${partner.businessName}` : null}
            </p>
            <p>{partner.email}</p>
            <span className={partnerStatusClass(partner.status)}>
              {formatPartnerStatusLabel(partner.status)}
            </span>
            {partner.refundsBlocked ? (
              <span className="pill pill_fraud" title={partner.refundsBlockedReason || 'Refunds blocked'}>
                <FaExclamationTriangle style={{ marginRight: 4 }} />
                Refunds blocked
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {partner.refundsBlocked ? (
        <AdminCriticalAlert
          severity={resolveCriticalSeverity(1, 1) ?? 'danger'}
          title="Wallet refunds are blocked"
          message={
            partner.refundsBlockedReason ||
            'This partner cannot receive automatic refunds until ops clears the audit hold.'
          }
          className="partner_refunds_alert"
        />
      ) : null}

      <section className="user_detail_stats_section stats_section">
        {detailStats.map((stat) => (
          <div key={stat.label} className={`stats_card ${stat.border}`}>
            <div className="stats_header">
              <p>{stat.label}</p>
              {stat.icon}
            </div>
            <div className="stats_bottom">
              <h2 className={stat.compact ? 'stat_value_compact' : undefined}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </section>

      <div className="admin_panel_card tabs_container">
        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={(tab) => onTabChange(tab as PartnerTab)} />

        {activeTab === 'overview' ? (
          <div className="tab_panel overview_tab">
            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Account overview</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">Partner ID</span>
                  <AdminCopyableValue
                    value={partner.id}
                    variant="inline"
                    className="overview_value overview_value_copyable"
                  />
                </div>
                <div className="overview_field">
                  <span className="overview_label">Agent</span>
                  <span className="overview_value">{partner.agentFullName}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Email</span>
                  <span className="overview_value">{partner.email}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Phone</span>
                  <span className="overview_value">{partner.phone}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Status</span>
                  <span className="overview_value">
                    <span className={partnerStatusClass(partner.status)}>
                      {formatPartnerStatusLabel(partner.status)}
                    </span>
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Applied</span>
                  <span className="overview_value">{formatAdminDate(partner.createdAt)}</span>
                </div>
                {partner.approvedAt ? (
                  <div className="overview_field">
                    <span className="overview_label">Approved</span>
                    <span className="overview_value">{formatAdminDate(partner.approvedAt)}</span>
                  </div>
                ) : null}
                <div className="overview_field">
                  <span className="overview_label">Last login</span>
                  <span className="overview_value">
                    {partner.lastLoginAt ? formatAdminDateTime(partner.lastLoginAt) : 'Never'}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Email verified</span>
                  <span className="overview_value">
                    {partner.emailVerified ? (
                      <span className="pill pill_success">Verified</span>
                    ) : (
                      'No'
                    )}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Wallet balance</span>
                  <span className="overview_value overview_value_emphasis">
                    {formatPrice(partner.walletBalance)}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Transactions</span>
                  <span className="overview_value">{transactionsTabCount}</span>
                </div>
                {partner.refundsBlocked ? (
                  <div className="overview_field">
                    <span className="overview_label">Refunds</span>
                    <span className="overview_value">
                      <span className="pill pill_fraud">Blocked</span>
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Business registration</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">Trading name</span>
                  <span className="overview_value">{partner.tradingName || '—'}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Business name (CAC)</span>
                  <span className="overview_value">{partner.businessName}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">CAC number</span>
                  <AdminCopyableValue
                    value={partner.cacRegistrationNumber}
                    variant="inline"
                    className="overview_value overview_value_copyable"
                  />
                </div>
              </div>
            </section>

            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Notifications &amp; alerts</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">Disco outages</span>
                  <span className="overview_value">
                    {partner.notifyDiscoOutages ? (
                      <span className="pill pill_success">Enabled</span>
                    ) : (
                      'Disabled'
                    )}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Low balance</span>
                  <span className="overview_value">
                    {partner.notifyLowBalance !== false ? (
                      <span className="pill pill_success">Enabled</span>
                    ) : (
                      'Disabled'
                    )}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">News updates</span>
                  <span className="overview_value">
                    {partner.notifyNewsUpdates !== false ? (
                      <span className="pill pill_success">Enabled</span>
                    ) : (
                      'Disabled'
                    )}
                  </span>
                </div>
                {partner.refundsBlocked ? (
                  <>
                    <div className="overview_field">
                      <span className="overview_label">Refunds blocked since</span>
                      <span className="overview_value">
                        {partner.refundsBlockedAt
                          ? formatAdminDateTime(partner.refundsBlockedAt)
                          : '—'}
                      </span>
                    </div>
                    <div className="overview_field">
                      <span className="overview_label">Block reason</span>
                      <span className="overview_value">
                        {partner.refundsBlockedReason || 'Pending admin review'}
                      </span>
                    </div>
                  </>
                ) : null}
                {partner.rejectionReason ? (
                  <div className="overview_field">
                    <span className="overview_label">Rejection reason</span>
                    <span className="overview_value">{partner.rejectionReason}</span>
                  </div>
                ) : null}
              </div>
            </section>

            {hasAdminReviewActions ? (
              <section className="detail_panel security_section security_actions_section">
                <h3 className="security_section_title">Admin review</h3>
                <div className="security_admin_actions">{renderPartnerAdminReviewActions()}</div>
              </section>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'transactions' ? (
          <div className="tab_panel user_txn_tab_panel">
            <p className="tab_hint">
              Live partner purchase history with search, filters, flagged review, and requery actions.
            </p>
            <AdminTransactionsListPanel
              partnerId={partner.id}
              showUser={false}
              enabled
              listTitle="Partner transactions"
              searchPlaceholder="Search reference, order ID, provider…"
              className="user_txn_tab_panel"
              detailReturnContext={transactionsTabReturn}
              onPaginationTotalChange={onTransactionsCountChange}
              onActionComplete={onRefresh}
            />
          </div>
        ) : null}

        {activeTab === 'api' ? (
          <div className="tab_panel">
            <PartnerApiKeysAdminPanel
              partnerId={partner.id}
              apiKeys={partner.apiKeys}
              canManage={canManage}
              onUpdated={onRefresh}
            />
          </div>
        ) : null}

        {activeTab === 'wallet-credit' && canCreditWallet ? (
          <div className="tab_panel partner_wallet_credit_tab">
            <p className="tab_hint partner_wallet_credit_tab_hint">
              Wallet balance is shown in the stats above. Review pending deposit requests on the left
              or credit the wallet manually on the right after verifying a bank transfer.
            </p>
            <div className="partner_wallet_credit_grid">
              <PartnerDepositRequestsPanel partnerId={partner.id} onUpdated={onRefresh} />
              <ManualPartnerWalletCreditPanel partnerId={partner.id} onCreditComplete={onRefresh} />
            </div>
          </div>
        ) : null}
      </div>

      <PartnerQuickActionModal
        open={Boolean(pendingAction)}
        action={pendingAction}
        partnerName={displayName}
        isSubmitting={isSubmitting}
        onClose={onCloseAction}
        onConfirm={onConfirmAction}
      />
    </div>
  );
}

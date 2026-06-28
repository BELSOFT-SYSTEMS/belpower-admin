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
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminUserDetails.css';
import '@/styles/adminTransactions.css';
import '@/styles/adminPartners.css';
import '@/styles/adminShared.css';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { AdminBackButton } from '@/components/admin/ui/AdminBackButton';
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
  unblockPartner,
  unblockPartnerRefunds,
} from '@/lib/adminPartners';
import type { PartnerDetail } from '@/types/adminPartners';
import { buildPartnerDetailReturn } from '@/utils/adminReturnNavigation';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import { getPartnerAvatarBackground, getPartnerInitials } from '@/utils/partnerAvatar';
import {
  getPartnerDisplayName,
  getPartnerQuickActionAvailability,
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

        {canManage || quickActions.refundsUnblock ? (
          <div className="profile_actions">
            {quickActions.approve && actions.canApprove ? (
              <button
                type="button"
                className="action_activate"
                disabled={isSubmitting}
                onClick={() => onOpenAction('approve')}
              >
                <FaCheckCircle /> Approve
              </button>
            ) : null}
            {quickActions.reject && actions.canReject ? (
              <button
                type="button"
                className="action_block"
                disabled={isSubmitting}
                onClick={() => onOpenAction('reject')}
              >
                <FaTimesCircle /> Reject
              </button>
            ) : null}
            {quickActions.refundsUnblock && actions.canUnblockRefunds ? (
              <button
                type="button"
                className="action_refunds_unblock"
                disabled={isSubmitting}
                onClick={() => onOpenAction('refundsUnblock')}
              >
                <FaUnlock /> Unblock refunds
              </button>
            ) : null}
            {quickActions.block && actions.canBlock ? (
              <button
                type="button"
                className="action_block"
                disabled={isSubmitting}
                onClick={() => onOpenAction('block')}
              >
                <FaBan /> Block
              </button>
            ) : null}
            {quickActions.unblock && actions.canUnblock ? (
              <button
                type="button"
                className="action_activate"
                disabled={isSubmitting}
                onClick={() => onOpenAction('unblock')}
              >
                <FaUserCheck /> Unblock
              </button>
            ) : null}
            {quickActions.deactivate && actions.canDeactivate ? (
              <button
                type="button"
                className="action_suspend"
                disabled={isSubmitting}
                onClick={() => onOpenAction('deactivate')}
              >
                <FaUserSlash /> Deactivate
              </button>
            ) : null}
          </div>
        ) : null}
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
          <div className="tab_panel">
            <div className="detail_grid">
              <section className="detail_panel">
                <h2>Business details</h2>
                <dl className="info_list">
                  <div className="info_row">
                    <dt>Trading name</dt>
                    <dd>{partner.tradingName || '—'}</dd>
                  </div>
                  <div className="info_row">
                    <dt>Business name (CAC)</dt>
                    <dd>{partner.businessName}</dd>
                  </div>
                  <div className="info_row">
                    <dt>CAC number</dt>
                    <dd>{partner.cacRegistrationNumber}</dd>
                  </div>
                  <div className="info_row">
                    <dt>Phone</dt>
                    <dd>{partner.phone}</dd>
                  </div>
                  <div className="info_row">
                    <dt>Applied</dt>
                    <dd>{formatAdminDateTime(partner.createdAt)}</dd>
                  </div>
                  {partner.approvedAt ? (
                    <div className="info_row">
                      <dt>Approved</dt>
                      <dd>{formatAdminDateTime(partner.approvedAt)}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="detail_panel">
                <h2>Account &amp; notifications</h2>
                <dl className="info_list">
                  <div className="info_row">
                    <dt>Email verified</dt>
                    <dd>{partner.emailVerified ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="info_row">
                    <dt>Disco outage alerts</dt>
                    <dd>{partner.notifyDiscoOutages ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div className="info_row">
                    <dt>Low balance alerts</dt>
                    <dd>{partner.notifyLowBalance !== false ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div className="info_row">
                    <dt>News updates</dt>
                    <dd>{partner.notifyNewsUpdates !== false ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  {partner.refundsBlocked ? (
                    <>
                      <div className="info_row">
                        <dt>Refunds blocked since</dt>
                        <dd>
                          {partner.refundsBlockedAt
                            ? formatAdminDateTime(partner.refundsBlockedAt)
                            : '—'}
                        </dd>
                      </div>
                      <div className="info_row">
                        <dt>Block reason</dt>
                        <dd>{partner.refundsBlockedReason || 'Pending admin review'}</dd>
                      </div>
                    </>
                  ) : null}
                  {partner.rejectionReason ? (
                    <div className="info_row">
                      <dt>Rejection reason</dt>
                      <dd>{partner.rejectionReason}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            </div>
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
            <PartnerDepositRequestsPanel partnerId={partner.id} onUpdated={onRefresh} />
            <ManualPartnerWalletCreditPanel partnerId={partner.id} onCreditComplete={onRefresh} />
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

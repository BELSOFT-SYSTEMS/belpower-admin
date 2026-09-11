'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FaUsers,
  FaWallet,
  FaBuilding,
  FaExchangeAlt,
  FaBan,
  FaUserCheck,
  FaUserSlash,
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
import { AdminTransactionsListPanel } from '@/components/admin/transactions/AdminTransactionsListPanel';
import {
  BusinessQuickActionModal,
  type BusinessQuickActionType,
} from '@/components/admin/businesses/BusinessQuickActionModal';
import {
  blockBusiness,
  deactivateBusiness,
  getBusinessDetail,
  unblockBusiness,
} from '@/lib/adminBusinesses';
import type { BusinessDetail } from '@/types/adminBusinesses';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import { getAvatarBackground, getInitialsFromDisplayName } from '@/utils/userAvatar';
import {
  getBusinessQuickActionAvailability,
  getBusinessQuickActionDisabledTitle,
} from '@/utils/businessQuickActionAvailability';

type TabId = 'overview' | 'transactions';

function businessStatusPill(status: string) {
  if (status === 'active') return 'pill pill_active';
  if (status === 'suspended') return 'pill pill_suspended';
  return 'pill pill_inactive';
}

function canManageBusinesses(admin: { allAccess?: boolean; role?: string } | null): boolean {
  if (!admin) return false;
  return Boolean(
    admin.allAccess || admin.role === 'super_admin' || admin.role === 'admin'
  );
}

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = String(params?.businessId || '');
  const { admin } = useAdminAuth();
  const canManage = canManageBusinesses(admin);

  const [tab, setTab] = useState<TabId>('overview');
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionsTabCount, setTransactionsTabCount] = useState(0);
  const [pendingAction, setPendingAction] = useState<BusinessQuickActionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const data = await getBusinessDetail(businessId);
    setBusiness(data);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBusinessDetail(businessId);
        if (!cancelled) setBusiness(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load business');
          setBusiness(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const handleConfirmAction = async (payload: { reason?: string }) => {
    if (!business || !pendingAction) return;

    setIsSubmitting(true);
    try {
      if (pendingAction === 'block') {
        await blockBusiness({ businessId: business.id, reason: payload.reason });
        toast.success('Business blocked');
      } else if (pendingAction === 'unblock') {
        await unblockBusiness(business.id);
        toast.success('Business unblocked');
      } else if (pendingAction === 'deactivate') {
        await deactivateBusiness({ businessId: business.id, reason: payload.reason });
        toast.success('Business deactivated');
      }

      setPendingAction(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview' },
      {
        id: 'transactions' as const,
        label: 'Transactions',
        badge: transactionsTabCount > 0 ? transactionsTabCount : undefined,
      },
    ],
    [transactionsTabCount]
  );

  if (isLoading) {
    return (
      <div className="user_details_page partner_details_page">
        <AdminBackButton
          defaultHref="/command-center/businesses"
          defaultLabel="Back to businesses"
        />
        <div className="users_page_loading" style={{ padding: '4rem 0' }}>
          <Loader2 className="animate-spin" size={32} aria-hidden />
          <p>Loading business…</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="user_details_page partner_details_page">
        <AdminBackButton
          defaultHref="/command-center/businesses"
          defaultLabel="Back to businesses"
        />
        <div className="admin_panel_card not_found">
          <p>{error || 'Business not found.'}</p>
        </div>
      </div>
    );
  }

  const actions = getBusinessQuickActionAvailability(business);

  const detailStats = [
    {
      icon: <FaWallet className="text-blue-500 text-2xl" />,
      label: 'Company wallet',
      value: formatPrice(business.companyWallet?.availableBalance ?? 0),
      border: 'border-blue-200',
    },
    {
      icon: <FaExchangeAlt className="text-indigo-500 text-2xl" />,
      label: 'Completed debit volume',
      value: formatPrice(business.stats.completedDebitVolume),
      border: 'border-indigo-200',
    },
    {
      icon: <FaUsers className="text-green-500 text-2xl" />,
      label: 'Team members',
      value: String(business.users.length),
      border: 'border-green-200',
    },
    {
      icon: <FaBuilding className="text-amber-500 text-2xl" />,
      label: 'Branches',
      value: String(business.branches.length),
      border: 'border-amber-200',
    },
  ];

  return (
    <div className="user_details_page partner_details_page">
      <AdminBackButton
        defaultHref="/command-center/businesses"
        defaultLabel="Back to businesses"
      />

      <header className="profile_header">
        <div className="profile_main">
          <div
            className="admin_user_avatar_initials"
            aria-hidden
            style={{ backgroundColor: getAvatarBackground(business.id) }}
          >
            {getInitialsFromDisplayName(business.businessName)}
          </div>
          <div>
            <h1>{business.businessName}</h1>
            <p>
              {business.businessId} · {business.email}
            </p>
            <span className={businessStatusPill(business.status)}>{business.status}</span>
          </div>
        </div>
      </header>

      <section className="user_detail_stats_section stats_section">
        {detailStats.map((stat) => (
          <div key={stat.label} className={`stats_card ${stat.border}`}>
            <div className="stats_header">
              <p>{stat.label}</p>
              {stat.icon}
            </div>
            <div className="stats_bottom">
              <h2>{stat.value}</h2>
            </div>
          </div>
        ))}
      </section>

      <div className="admin_panel_card tabs_container">
        <AdminTabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'overview' ? (
          <div className="tab_panel overview_tab">
            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Company</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">Business code</span>
                  <AdminCopyableValue
                    value={business.businessId}
                    variant="inline"
                    className="overview_value overview_value_copyable"
                  />
                </div>
                <div className="overview_field">
                  <span className="overview_label">Email</span>
                  <span className="overview_value">{business.email}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Phone</span>
                  <span className="overview_value">{business.phone || '—'}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Address</span>
                  <span className="overview_value">{business.address || '—'}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Status</span>
                  <span className="overview_value">
                    <span className={businessStatusPill(business.status)}>{business.status}</span>
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Created</span>
                  <span className="overview_value">
                    {business.createdAt ? formatAdminDateTime(business.createdAt) : '—'}
                  </span>
                </div>
              </div>
            </section>

            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Wallet</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">Company balance</span>
                  <span className="overview_value overview_value_emphasis">
                    {formatPrice(business.companyWallet?.availableBalance ?? 0)}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Wallet status</span>
                  <span className="overview_value">{business.companyWallet?.status || '—'}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Completed debit volume</span>
                  <span className="overview_value overview_value_emphasis">
                    {formatPrice(business.stats.completedDebitVolume)}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Transactions</span>
                  <span className="overview_value">{business.stats.transactionCount}</span>
                </div>
              </div>
            </section>

            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Team ({business.users.length})</h2>
              {business.users.length === 0 ? (
                <p className="empty_fallback">No team members.</p>
              ) : (
                <div className="overview_fields_grid">
                  {business.users.map((user) => (
                    <div key={user.id} className="overview_field">
                      <span className="overview_label">{user.role}</span>
                      <span className="overview_value">
                        {user.firstName} {user.lastName} · {user.email}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="detail_panel overview_account_panel">
              <h2 className="overview_section_title">Branches ({business.branches.length})</h2>
              {business.branches.length === 0 ? (
                <p className="empty_fallback">No branches.</p>
              ) : (
                <div className="overview_fields_grid">
                  {business.branches.map((branch) => (
                    <div key={branch.id} className="overview_field">
                      <span className="overview_label">
                        {branch.name}
                        {branch.isHeadOffice ? ' (Head Office)' : ''}
                      </span>
                      <span className="overview_value">
                        {[branch.city, branch.meterNumber ? `Meter ${branch.meterNumber}` : null]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {canManage ? (
              <section className="detail_panel security_section security_actions_section">
                <h3 className="security_section_title">Admin review</h3>
                <div className="security_admin_actions">
                  <button
                    type="button"
                    className="security_action_btn action_block"
                    title={getBusinessQuickActionDisabledTitle('block', business)}
                    disabled={isSubmitting || !actions.canBlock}
                    aria-disabled={isSubmitting || !actions.canBlock}
                    onClick={() => {
                      if (isSubmitting || !actions.canBlock) return;
                      setPendingAction('block');
                    }}
                  >
                    <FaBan /> Block business
                  </button>
                  <button
                    type="button"
                    className="security_action_btn action_activate"
                    title={getBusinessQuickActionDisabledTitle('unblock', business)}
                    disabled={isSubmitting || !actions.canUnblock}
                    aria-disabled={isSubmitting || !actions.canUnblock}
                    onClick={() => {
                      if (isSubmitting || !actions.canUnblock) return;
                      setPendingAction('unblock');
                    }}
                  >
                    <FaUserCheck /> Unblock business
                  </button>
                  <button
                    type="button"
                    className="security_action_btn action_suspend"
                    title={getBusinessQuickActionDisabledTitle('deactivate', business)}
                    disabled={isSubmitting || !actions.canDeactivate}
                    aria-disabled={isSubmitting || !actions.canDeactivate}
                    onClick={() => {
                      if (isSubmitting || !actions.canDeactivate) return;
                      setPendingAction('deactivate');
                    }}
                  >
                    <FaUserSlash /> Deactivate business
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="tab_panel">
            <AdminTransactionsListPanel
              businessId={business.id}
              showUser={false}
              listTitle="Business transactions"
              searchPlaceholder="Search business transactions…"
              onPaginationTotalChange={setTransactionsTabCount}
            />
          </div>
        )}
      </div>

      <BusinessQuickActionModal
        open={Boolean(pendingAction)}
        action={pendingAction}
        businessName={business.businessName}
        isSubmitting={isSubmitting}
        onClose={() => setPendingAction(null)}
        onConfirm={(payload) => void handleConfirmAction(payload)}
      />
    </div>
  );
}

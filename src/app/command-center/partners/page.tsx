'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaHandshake,
  FaSearch,
  FaUserCheck,
  FaBan,
  FaExclamationTriangle,
  FaClock,
  FaUnlock,
  FaTimesCircle,
  FaUserSlash,
  FaCheckCircle,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminUsers.css';
import '@/styles/adminPartners.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import {
  PartnerQuickActionModal,
  type PartnerQuickActionType,
} from '@/components/admin/partners/PartnerQuickActionModal';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminPartnersList } from '@/hooks/useAdminPartnersList';
import {
  approvePartner,
  blockPartner,
  deactivatePartner,
  rejectPartner,
  unblockPartner,
  unblockPartnerRefunds,
} from '@/lib/adminPartners';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import { getPartnerAvatarBackground, getPartnerInitials } from '@/utils/partnerAvatar';
import { buildPartnersStatusFilterOptions } from '@/utils/partnerListFilters';
import {
  getPartnerDisplayName,
  getPartnerQuickActionAvailability,
  getPartnerQuickActionDisabledTitle,
  partnerStatusClass,
  formatPartnerStatusLabel,
} from '@/utils/partnerQuickActionAvailability';
import type { PartnerListItem } from '@/types/adminPartners';

type PendingAction = {
  type: PartnerQuickActionType;
  partners: PartnerListItem[];
};

export default function PartnersPage() {
  const { canAccess } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingPartnerId, setActingPartnerId] = useState<string | null>(null);

  const { partners, quickActions, filters, stats, pagination, isLoading, error, refresh } =
    useAdminPartnersList({
      search: searchTerm,
      statusFilter,
      page,
    });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const openAction = (type: PartnerQuickActionType, partner: PartnerListItem) => {
    setPendingAction({ type, partners: [partner] });
  };

  const closeAction = () => {
    if (!isSubmitting) setPendingAction(null);
  };

  const handleConfirmAction = async (payload: { note?: string; reason?: string }) => {
    if (!pendingAction) return;

    const { type, partners: actionPartners } = pendingAction;
    const partner = actionPartners[0];
    if (!partner) return;

    setIsSubmitting(true);
    setActingPartnerId(partner.id);

    try {
      if (type === 'approve') {
        await approvePartner({ partnerId: partner.id, note: payload.note });
        toast.success(`${getPartnerDisplayName(partner)} approved`);
      } else if (type === 'reject') {
        await rejectPartner({
          partnerId: partner.id,
          reason: payload.reason || 'Application rejected',
        });
        toast.success(`${getPartnerDisplayName(partner)} rejected`);
      } else if (type === 'block') {
        await blockPartner({ partnerId: partner.id, reason: payload.reason });
        toast.success(`${getPartnerDisplayName(partner)} blocked`);
      } else if (type === 'unblock') {
        await unblockPartner(partner.id);
        toast.success(`${getPartnerDisplayName(partner)} unblocked`);
      } else if (type === 'deactivate') {
        await deactivatePartner({ partnerId: partner.id, reason: payload.reason });
        toast.success(`${getPartnerDisplayName(partner)} deactivated`);
      } else if (type === 'refundsUnblock') {
        await unblockPartnerRefunds(partner.id, payload.note);
        toast.success(`Refunds restored for ${getPartnerDisplayName(partner)}`);
      }

      setPendingAction(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setActingPartnerId(null);
    }
  };

  if (!canAccess('partners.list')) {
    return (
      <div className="users_page partners_page">
        <h1>Partners</h1>
        <p className="empty_fallback">You do not have permission to view partner applications.</p>
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          key: 'total',
          icon: <FaHandshake className="text-indigo-500 text-xl" />,
          label: 'Total partners',
          value: stats.totalPartners.count.toLocaleString(),
          sub: stats.totalPartners.definition,
          border: 'border-indigo-200',
        },
        {
          key: 'pending',
          icon: <FaClock className="text-amber-500 text-xl" />,
          label: 'Pending review',
          value: stats.pendingReview.count.toLocaleString(),
          sub: stats.pendingReview.definition,
          border: 'border-amber-200',
        },
        {
          key: 'active',
          icon: <FaUserCheck className="text-green-500 text-xl" />,
          label: 'Active partners',
          value: stats.activePartners.count.toLocaleString(),
          sub: stats.activePartners.definition,
          border: 'border-green-200',
        },
        {
          key: 'refunds',
          icon: <FaExclamationTriangle className="text-orange-500 text-xl" />,
          label: 'Refunds blocked',
          value: stats.refundsBlocked.count.toLocaleString(),
          sub: stats.refundsBlocked.definition,
          border: 'border-orange-200',
        },
        {
          key: 'blocked',
          icon: <FaBan className="text-red-500 text-xl" />,
          label: 'Blocked partners',
          value: stats.blockedPartners.count.toLocaleString(),
          sub: stats.blockedPartners.definition,
          border: 'border-red-200',
        },
        {
          key: 'deactivated',
          icon: <FaUserSlash className="text-gray-500 text-xl" />,
          label: 'Deactivated',
          value: stats.deactivatedPartners.count.toLocaleString(),
          sub: stats.deactivatedPartners.definition,
          border: 'border-gray-200',
        },
      ]
    : [];

  const statusFilterOptions = buildPartnersStatusFilterOptions(filters);
  const refundsBlockedCount = stats?.refundsBlocked?.count ?? 0;
  const refundsBlockedOnPage = partners.filter((partner) => partner.refundsBlocked).length;
  const refundsSeverity = resolveCriticalSeverity(refundsBlockedCount, refundsBlockedOnPage);
  const totalPages = pagination?.totalPages ?? 1;
  const isRowBusy = (partnerId: string) => actingPartnerId === partnerId;

  return (
    <div className="users_page partners_page">
      <h1>Partners</h1>

      {statCards.length > 0 && (
        <section className="stats_section">
          {statCards.map((stat) => (
            <div key={stat.key} className={`${stat.border} stats_card`}>
              <div className="stats_header">
                <p>{stat.label}</p>
                {stat.icon}
              </div>
              <div className="stats_bottom">
                <h2>{stat.value}</h2>
                <p>{stat.sub}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {refundsSeverity && (
        <AdminCriticalAlert
          severity={refundsSeverity}
          title={`${refundsBlockedCount} partner${refundsBlockedCount === 1 ? '' : 's'} with refunds blocked`}
          message={
            refundsBlockedOnPage > 0
              ? `${refundsBlockedOnPage} on this page. Filter by Refunds blocked to review audit holds.`
              : 'Partner wallet refunds are paused pending ops review. Filter by Refunds blocked to investigate.'
          }
        />
      )}

      <section>
        <div className="manage_header">
          <h2>All partners</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search trading name, business, agent, email, phone, CAC..."
              value={searchTerm}
              maxLength={128}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch />
          </div>
        </div>

        <div className="partners_list_filters">
          <AdminDropdown
            variant="filter"
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter by status"
            options={statusFilterOptions}
          />
        </div>

        {isLoading ? (
          <div className="users_page_loading">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p>Loading partners…</p>
          </div>
        ) : error ? (
          <div className="users_page_error">
            <p>{error}</p>
            <button type="button" className="users_page_retry" onClick={refresh}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="admin_txn_list">
              {partners.length > 0 ? (
                partners.map((partner) => {
                  const actions = getPartnerQuickActionAvailability(partner);
                  const rowBusy = isRowBusy(partner.id);
                  const displayName = getPartnerDisplayName(partner);

                  return (
                    <div key={partner.id} className="admin_user_row">
                      <Link
                        href={`/command-center/partners/${partner.id}`}
                        className="admin_user_row_link"
                      >
                        <div
                          className="admin_user_avatar_initials"
                          aria-hidden
                          style={{ backgroundColor: getPartnerAvatarBackground(partner.id) }}
                        >
                          {getPartnerInitials(partner)}
                        </div>
                        <div className="admin_user_info">
                          <div className="admin_user_name">
                            {displayName}
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
                          <div className="admin_user_email">
                            {partner.agentFullName} · {partner.email}
                          </div>
                        </div>
                      </Link>

                      <div className="admin_user_meta">
                        <div className="partner_list_meta_values">
                          <span>{formatPrice(partner.walletBalance)}</span>
                          <span>{formatAdminDateTime(partner.createdAt)}</span>
                        </div>

                        <div
                          className="user_list_quick_actions"
                          role="group"
                          aria-label={`Quick actions for ${displayName}`}
                        >
                          {quickActions.approve && (
                            <button
                              type="button"
                              className="user_quick_action action_activate"
                              title={getPartnerQuickActionDisabledTitle('approve', partner)}
                              aria-label="Approve"
                              disabled={rowBusy || !actions.canApprove}
                              onClick={() => openAction('approve', partner)}
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                          {quickActions.reject && (
                            <button
                              type="button"
                              className="user_quick_action action_block"
                              title={getPartnerQuickActionDisabledTitle('reject', partner)}
                              aria-label="Reject"
                              disabled={rowBusy || !actions.canReject}
                              onClick={() => openAction('reject', partner)}
                            >
                              <FaTimesCircle />
                            </button>
                          )}
                          {quickActions.refundsUnblock && partner.refundsBlocked && (
                            <button
                              type="button"
                              className="user_quick_action action_suspend"
                              title={getPartnerQuickActionDisabledTitle('refundsUnblock', partner)}
                              aria-label="Unblock refunds"
                              disabled={rowBusy || !actions.canUnblockRefunds}
                              onClick={() => openAction('refundsUnblock', partner)}
                            >
                              <FaUnlock />
                            </button>
                          )}
                          {quickActions.block && (
                            <button
                              type="button"
                              className="user_quick_action action_block"
                              title={getPartnerQuickActionDisabledTitle('block', partner)}
                              aria-label="Block"
                              disabled={rowBusy || !actions.canBlock}
                              onClick={() => openAction('block', partner)}
                            >
                              <FaBan />
                            </button>
                          )}
                          {quickActions.unblock && (
                            <button
                              type="button"
                              className="user_quick_action action_activate"
                              title={getPartnerQuickActionDisabledTitle('unblock', partner)}
                              aria-label="Unblock"
                              disabled={rowBusy || !actions.canUnblock}
                              onClick={() => openAction('unblock', partner)}
                            >
                              <FaUserCheck />
                            </button>
                          )}
                          {quickActions.deactivate && (
                            <button
                              type="button"
                              className="user_quick_action action_suspend"
                              title={getPartnerQuickActionDisabledTitle('deactivate', partner)}
                              aria-label="Deactivate"
                              disabled={rowBusy || !actions.canDeactivate}
                              onClick={() => openAction('deactivate', partner)}
                            >
                              <FaUserSlash />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty_fallback">No partners found for the current filters.</p>
              )}
            </div>

            <div className="users_pagination_bar">
              <p className="users_pagination_meta">
                Page {pagination?.page ?? page} of {totalPages} ·{' '}
                {(pagination?.total ?? 0).toLocaleString()} partners
              </p>
              <div className="pagination_section">
                <button
                  type="button"
                  className="pagination_btn"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </button>
                <span className="current btn_active">{page}</span>
                <button
                  type="button"
                  className="pagination_btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <PartnerQuickActionModal
        open={Boolean(pendingAction)}
        action={pendingAction?.type ?? null}
        partnerName={
          pendingAction?.partners[0]
            ? getPartnerDisplayName(pendingAction.partners[0])
            : 'Partner'
        }
        isSubmitting={isSubmitting}
        onClose={closeAction}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

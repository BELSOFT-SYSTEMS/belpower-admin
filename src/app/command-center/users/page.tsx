'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaUsers,
  FaUserPlus,
  FaUserCheck,
  FaUserSlash,
  FaSearch,
  FaExclamationTriangle,
  FaEnvelope,
  FaBan,
  FaTrash,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminUsers.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { resolveCriticalSeverity } from '@/utils/adminCriticalSeverity';
import {
  UserQuickActionModal,
  type UserQuickActionType,
} from '@/components/admin/users/UserQuickActionModal';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminUsersList } from '@/hooks/useAdminUsersList';
import { activateUser, blockUser, suspendUser } from '@/lib/adminUsers';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';
import { formatUserLastActive } from '@/utils/resolveUserLastActive';
import {
  getQuickActionDisabledTitle,
  getUserQuickActionAvailability,
} from '@/utils/userQuickActionAvailability';
import { buildUsersStatusFilterOptions } from '@/utils/userListFilters';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import type { ApiUser } from '@/types/adminUsers';

type PendingAction = {
  type: UserQuickActionType;
  user: ApiUser;
};

export default function UsersPage() {
  const router = useRouter();
  const { canAccess } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);

  const { users, quickActions, filters, stats, pagination, isLoading, error, refresh } =
    useAdminUsersList({
      search: searchTerm,
      statusFilter,
      page,
    });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const openAction = (type: UserQuickActionType, user: ApiUser) => {
    setPendingAction({ type, user });
  };

  const closeAction = () => {
    if (!isSubmitting) setPendingAction(null);
  };

  const handleMessage = (user: ApiUser) => {
    router.push(`/command-center/messages?userId=${encodeURIComponent(user.id)}`);
  };

  const handleConfirmAction = async (payload: { reason?: string; days?: number }) => {
    if (!pendingAction) return;

    const { type, user } = pendingAction;

    if (getAdminDemoMode()) {
      toast.success(`Demo: ${user.fullName} ${type} action simulated.`);
      setPendingAction(null);
      return;
    }
    setIsSubmitting(true);
    setActingUserId(user.id);

    try {
      if (type === 'block') {
        await blockUser(user.id, payload.reason);
        toast.success(`${user.fullName} has been blocked.`);
      } else if (type === 'suspend') {
        await suspendUser(user.id, payload);
        toast.success(`${user.fullName} has been suspended.`);
      } else {
        await activateUser(user.id);
        toast.success(`${user.fullName} has been activated.`);
      }

      setPendingAction(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setActingUserId(null);
    }
  };

  if (!canAccess('users.list')) {
    return (
      <div className="users_page">
        <h1>Users</h1>
        <p className="empty_fallback">You do not have access to users.</p>
      </div>
    );
  }

  const statCards = stats
    ? [
        ...(stats.totalUsers
          ? [
              {
                key: 'total',
                icon: <FaUsers className="text-indigo-500 text-xl" />,
                label: 'Total users',
                value: stats.totalUsers.count.toLocaleString(),
                sub: 'All registered users',
                border: 'border-indigo-200',
              },
            ]
          : []),
        {
          key: 'new',
          icon: <FaUserPlus className="text-green-500 text-xl" />,
          label: 'New users',
          value: stats.newUsers.count.toLocaleString(),
          sub: 'Last 7 days',
          border: 'border-green-200',
        },
        {
          key: 'active',
          icon: <FaUserCheck className="text-blue-500 text-xl" />,
          label: 'Active users',
          value: stats.activeUsers.count.toLocaleString(),
          sub: 'Engaged in last 14–30 days',
          border: 'border-blue-200',
        },
        {
          key: 'flagged',
          icon: <FaUserSlash className="text-orange-500 text-xl" />,
          label: 'Flagged users',
          value: stats.flaggedUsers.count.toLocaleString(),
          sub: 'Suspicious activity',
          border: 'border-orange-200',
        },
        ...(stats.deletedUsers
          ? [
              {
                key: 'deleted',
                icon: <FaTrash className="text-gray-500 text-xl" />,
                label: 'Deleted users',
                value: stats.deletedUsers.count.toLocaleString(),
                sub: 'Soft-deleted accounts',
                border: 'border-gray-200',
              },
            ]
          : []),
      ]
    : [];

  const statusFilterOptions = buildUsersStatusFilterOptions(filters);

  const flaggedUsersCount = stats?.flaggedUsers?.count ?? 0;
  const highRiskOnPage = users.filter(
    (user) => user.riskScore >= 70 || user.displayStatus === 'blocked'
  ).length;
  const flaggedSeverity = resolveCriticalSeverity(flaggedUsersCount, highRiskOnPage);

  const totalPages = pagination?.totalPages ?? pagination?.total_pages ?? 1;
  const isRowBusy = (userId: string) => actingUserId === userId;

  return (
    <div className="users_page">
      <h1>Users</h1>

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

      {flaggedSeverity && (
        <AdminCriticalAlert
          severity={flaggedSeverity}
          title={`${flaggedUsersCount} flagged user${flaggedUsersCount === 1 ? '' : 's'}`}
          message={
            highRiskOnPage > 0
              ? `${highRiskOnPage} high-risk or blocked account${highRiskOnPage === 1 ? '' : 's'} on this page. Filter by Suspicious to review all flagged users.`
              : 'Accounts with suspicious activity need review. Filter by Suspicious to investigate.'
          }
        />
      )}

      <section>
        <div className="manage_header">
          <h2>All users</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch />
          </div>
        </div>

        <div className="admin_filter_row">
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
            <p>Loading users…</p>
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
              {users.length > 0 ? (
                users.map((user) => {
                  const actions = getUserQuickActionAvailability(user);
                  const rowBusy = isRowBusy(user.id);
                  const showActivate = Boolean(quickActions.activate && actions.canActivate);

                  const isDeleted = user.displayStatus === 'deleted';
                  const showRowActions = !isDeleted;

                  return (
                  <div
                    key={user.id}
                    className={`admin_user_row${isDeleted ? ' admin_user_row_deleted' : ''}`}
                  >
                    <Link
                      href={`/command-center/users/${user.id}`}
                      className="admin_user_row_link"
                    >
                      <div
                        className="admin_user_avatar_initials"
                        aria-hidden
                        style={{ backgroundColor: getAvatarBackground(user.id) }}
                      >
                        {getUserInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="admin_user_info">
                        <div className="admin_user_name">
                          {user.fullName}
                          {user.isInternalTestAccount && (
                            <span className="pill pill_internal_test" title="Internal test account">
                              Internal test
                            </span>
                          )}
                          {user.suspiciousActivity && (
                            <span className="pill pill_fraud" title="Suspicious activity">
                              <FaExclamationTriangle style={{ marginRight: 4 }} />
                              Flagged
                            </span>
                          )}
                        </div>
                        <div className="admin_user_email">{user.email}</div>
                      </div>
                    </Link>
                    <div className="admin_user_meta">
                      {showRowActions && (
                      <div
                        className="user_list_quick_actions"
                        role="group"
                        aria-label={`Quick actions for ${user.fullName}`}
                      >
                        {quickActions.message && (
                          <button
                            type="button"
                            className="user_quick_action action_message"
                            title="Message user"
                            aria-label="Message"
                            disabled={rowBusy}
                            onClick={() => handleMessage(user)}
                          >
                            <FaEnvelope />
                          </button>
                        )}
                        {quickActions.suspend && (
                          <button
                            type="button"
                            className="user_quick_action action_suspend"
                            title={getQuickActionDisabledTitle('suspend', user)}
                            aria-label="Suspend"
                            disabled={rowBusy || !actions.canSuspend}
                            onClick={() => openAction('suspend', user)}
                          >
                            <FaUserSlash />
                          </button>
                        )}
                        {quickActions.block && (
                          <button
                            type="button"
                            className="user_quick_action action_block"
                            title={getQuickActionDisabledTitle('block', user)}
                            aria-label="Block"
                            disabled={rowBusy || !actions.canBlock}
                            onClick={() => openAction('block', user)}
                          >
                            <FaBan />
                          </button>
                        )}
                        {showActivate && (
                          <button
                            type="button"
                            className="user_quick_action action_activate"
                            title={getQuickActionDisabledTitle('activate', user)}
                            aria-label="Activate"
                            disabled={rowBusy}
                            onClick={() => openAction('activate', user)}
                          >
                            <FaUserCheck />
                          </button>
                        )}
                      </div>
                      )}
                      <Link
                        href={`/command-center/users/${user.id}`}
                        className="admin_user_meta_link"
                      >
                        <span className={`pill pill_${user.displayStatus}`}>
                          {user.displayStatus}
                        </span>
                        <p className="admin_user_last_active">
                          {isDeleted && user.deletedAt
                            ? `Deleted ${formatAdminDateTime(user.deletedAt)}`
                            : formatUserLastActive(user)}
                        </p>
                      </Link>
                    </div>
                  </div>
                  );
                })
              ) : (
                <p className="empty_fallback" style={{ padding: '2rem' }}>
                  No users found.
                </p>
              )}
            </div>

            {pagination && pagination.total > 0 && (
              <div className="users_pagination_bar">
                <p className="users_pagination_meta">
                  Page {pagination.page} of {totalPages} ·{' '}
                  {pagination.total.toLocaleString()} users
                </p>
                <div className="pagination_section">
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="current btn_active">{page}</span>
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <UserQuickActionModal
        open={!!pendingAction}
        action={pendingAction?.type ?? null}
        userName={pendingAction?.user.fullName ?? ''}
        isSubmitting={isSubmitting}
        onClose={closeAction}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

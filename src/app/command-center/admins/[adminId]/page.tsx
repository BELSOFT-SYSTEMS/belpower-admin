'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaKey,
  FaCheckCircle,
  FaBan,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminUserDetails.css';
import '@/styles/adminAdminDetails.css';
import '@/styles/adminAdmins.css';
import '@/styles/adminShared.css';
import { AdminFormModal } from '@/components/admin/admins/AdminFormModal';
import { AdminConfirmModal } from '@/components/admin/admins/AdminConfirmModal';
import { AdminPermissionsPanel } from '@/components/admin/admins/AdminPermissionsPanel';
import { AdminActivityDetailModal } from '@/components/admin/admins/AdminActivityDetailModal';
import { AdminManagementGate } from '@/components/admin/admins/AdminManagementGate';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminDetail } from '@/hooks/useAdminDetail';
import {
  deleteAdminAccount,
  formValuesToUpdatePayload,
  requestAdminPasswordReset,
  setAdminAccountStatus,
  updateAdminProfile,
} from '@/lib/adminAdmins';
import { AuthApiError } from '@/lib/adminAuth';
import type { AdminFormValues, AdminLog, AdminLogStatus } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS } from '@/types/adminManagement';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';
import { formatAdminRole, getRolePillClass } from '@/utils/adminRoleDisplay';
import {
  canDeleteAdminAccount,
  canEditAdminAccount,
  canResetAdminPassword,
  canSuspendAdminAccount,
  canViewAdminDetail,
  getEditableAdminRoles,
} from '@/utils/adminManagementAccess';

function logStatusClass(status?: AdminLogStatus): string {
  if (status === 'failed') return 'admin_log_status_failed';
  if (status === 'warning') return 'admin_log_status_warning';
  return 'admin_log_status_success';
}

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams<{ adminId: string }>();
  const adminId = params?.adminId ?? '';
  const { admin: actor, refreshProfile } = useAdminAuth();
  const { admin, logs, isLoading, error, refresh } = useAdminDetail(adminId);

  const [activeTab, setActiveTab] = useState('overview');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canView = admin ? canViewAdminDetail(actor, admin) : false;
  const showEdit = admin ? canEditAdminAccount(actor, admin) : false;
  const showDelete = admin ? canDeleteAdminAccount(actor, admin) : false;
  const showReset = admin ? canResetAdminPassword(actor, admin) : false;
  const showSuspend = admin ? canSuspendAdminAccount(actor, admin) : false;
  const isSuspended = admin?.status === 'suspended';
  const editRoleOptions = useMemo(
    () => (admin ? getEditableAdminRoles(actor, admin) : []),
    [actor, admin]
  );

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'activity', label: 'Activity', badge: logs.length },
      { id: 'permissions', label: 'Permissions' },
    ],
    [logs.length]
  );

  const editInitial = useMemo<AdminFormValues | undefined>(() => {
    if (!admin) return undefined;
    return {
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status === 'pending' || admin.status === 'inactive' ? 'suspended' : admin.status,
    };
  }, [admin]);

  const handleActionError = (err: unknown, fallback: string) => {
    if (err instanceof AuthApiError) {
      setActionError(err.message);
    } else if (err instanceof Error) {
      setActionError(err.message);
    } else {
      setActionError(fallback);
    }
  };

  if (isLoading) {
    return (
      <AdminManagementGate>
        <div className="admin_details_page">
          <div className="empty_fallback" style={{ padding: '3rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={20} />
            Loading admin…
          </div>
        </div>
      </AdminManagementGate>
    );
  }

  if (!admin || !canView) {
    return (
      <AdminManagementGate>
        <div className="admin_details_page">
          <button
            type="button"
            className="receipt_back"
            onClick={() => router.push('/command-center/admins')}
          >
            <FaArrowLeft /> Back to admins
          </button>
          <div className="admin_panel_card not_found">
            <p>
              {!admin
                ? error ?? 'Admin not found.'
                : 'You do not have access to this admin profile.'}
            </p>
          </div>
        </div>
      </AdminManagementGate>
    );
  }

  const handleUpdate = async (values: AdminFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await updateAdminProfile(
        admin.id,
        formValuesToUpdatePayload(values, {
          includeRole: editRoleOptions.length > 0,
        })
      );
      setBanner(`${values.first_name} ${values.last_name} was updated successfully.`);
      setFormOpen(false);
      if (actor?.id === admin.id) {
        await refreshProfile();
      }
      await refresh();
    } catch (err) {
      handleActionError(err, 'Failed to update admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await deleteAdminAccount(admin.id);
      router.push('/command-center/admins');
    } catch (err) {
      handleActionError(err, 'Failed to delete admin');
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await requestAdminPasswordReset(admin.email);
      setBanner(`Password reset email sent to ${admin.email} successfully.`);
      setResetOpen(false);
    } catch (err) {
      handleActionError(err, 'Failed to send password reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendToggle = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const nextStatus = isSuspended ? 'active' : 'suspended';
      await setAdminAccountStatus(admin.id, nextStatus);
      const verb = nextStatus === 'suspended' ? 'suspended' : 'activated';
      setBanner(`${admin.first_name} ${admin.last_name} was ${verb} successfully.`);
      setSuspendOpen(false);
      await refresh();
    } catch (err) {
      handleActionError(err, 'Failed to update admin status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminManagementGate>
      <div className="admin_details_page">
        <button
          type="button"
          className="receipt_back"
          onClick={() => router.push('/command-center/admins')}
        >
          <FaArrowLeft /> Back to admins
        </button>

        {banner && (
          <div className="settings_banner settings_banner_success" role="status">
            <FaCheckCircle style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{banner}</span>
          </div>
        )}

        {actionError && (
          <div className="settings_banner settings_banner_error" role="alert">
            <FaExclamationTriangle style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{actionError}</span>
          </div>
        )}

        <header className="profile_header">
          <div className="profile_main">
            <div
              className="admin_user_avatar_initials admin_user_avatar_initials--lg"
              style={{ backgroundColor: getAvatarBackground(admin.id) }}
              aria-hidden
            >
              {getUserInitials(admin.first_name, admin.last_name)}
            </div>
            <div>
              <div className="admin_user_name_row">
                <h1>
                  {admin.first_name} {admin.last_name}
                </h1>
                <span className={`pill ${getRolePillClass(admin.role)}`}>
                  {formatAdminRole(admin.role)}
                </span>
              </div>
              <p>{admin.email}</p>
              <p>{admin.phone || '—'}</p>
              <span
                className={`pill ${admin.status === 'active' ? 'pill_active' : 'pill_suspended'}`}
              >
                {admin.status}
              </span>
            </div>
          </div>
          {(showEdit || showReset || showSuspend || showDelete) && (
            <div className="profile_actions">
              {showEdit && (
                <button type="button" className="action_edit" onClick={() => setFormOpen(true)}>
                  <FaEdit /> Update
                </button>
              )}
              {showSuspend && (
                <button
                  type="button"
                  className={isSuspended ? 'action_activate' : 'action_suspend'}
                  onClick={() => setSuspendOpen(true)}
                >
                  {isSuspended ? (
                    <>
                      <FaCheckCircle /> Activate
                    </>
                  ) : (
                    <>
                      <FaBan /> Suspend
                    </>
                  )}
                </button>
              )}
              {showReset && (
                <button type="button" className="action_reset" onClick={() => setResetOpen(true)}>
                  <FaKey /> Reset password
                </button>
              )}
              {showDelete && (
                <button type="button" className="action_delete" onClick={() => setDeleteOpen(true)}>
                  <FaTrash /> Delete
                </button>
              )}
            </div>
          )}
        </header>

        <div className="admin_panel_card tabs_container">
          <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <div className="tab_panel overview_tab">
              <h2 className="overview_section_title">Account overview</h2>
              <div className="overview_fields_grid">
                <div className="overview_field">
                  <span className="overview_label">Admin ID</span>
                  <span className="overview_value">{admin.id}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Role</span>
                  <span className="overview_value">{ADMIN_ROLE_LABELS[admin.role]}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Status</span>
                  <span className="overview_value" style={{ textTransform: 'capitalize' }}>
                    {admin.status}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Email verified</span>
                  <span className="overview_value">
                    {admin.email_verified ? (
                      <span className="pill pill_active">Verified</span>
                    ) : (
                      'No'
                    )}
                  </span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Created</span>
                  <span className="overview_value">{admin.created_at}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Created by</span>
                  <span className="overview_value">{admin.created_by ?? '—'}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Last login</span>
                  <span className="overview_value">{admin.last_login}</span>
                </div>
                <div className="overview_field">
                  <span className="overview_label">Access</span>
                  <span className="overview_value">
                    {admin.all_access || admin.role === 'super_admin'
                      ? 'Full access'
                      : `${admin.permissions?.length ?? 0} permissions`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="tab_panel logs_section">
              <h2 className="overview_section_title">Activity log</h2>
              <p className="activity_log_hint">Click a row to view full details.</p>
              {logs.length > 0 ? (
                <table className="admin_data_table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Detail</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="admin_log_row_clickable"
                        onClick={() => setSelectedLog(log)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedLog(log);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${log.action}`}
                      >
                        <td>{log.action}</td>
                        <td>
                          {log.detail}
                          {log.entity_type && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>
                              {log.entity_type}
                              {log.entity_id ? ` · ${log.entity_id}` : ''}
                            </span>
                          )}
                          {log.metadata?.reason && (
                            <span className="activity_log_reason_preview">
                              Reason: {String(log.metadata.reason)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`admin_log_status ${logStatusClass(log.status)}`}>
                            {log.status ?? 'success'}
                          </span>
                        </td>
                        <td>{log.timestamp}</td>
                        <td>{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty_fallback">No activity logs for this admin yet.</p>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="tab_panel">
              <h2 className="overview_section_title">Permissions</h2>
              <AdminPermissionsPanel admin={admin} />
            </div>
          )}
        </div>

        <AdminFormModal
          open={formOpen}
          mode="edit"
          initial={editInitial}
          roleOptions={editRoleOptions}
          onClose={() => !isSubmitting && setFormOpen(false)}
          onSubmit={handleUpdate}
        />

        <AdminConfirmModal
          open={deleteOpen}
          title="Delete admin"
          message={`Remove ${admin.first_name} ${admin.last_name}? Their account will be deactivated and they will lose access to the Command Center.`}
          confirmLabel="Delete admin"
          danger
          onClose={() => !isSubmitting && setDeleteOpen(false)}
          onConfirm={handleDelete}
        />

        <AdminConfirmModal
          open={resetOpen}
          title="Reset password"
          message={`Send a password reset link to ${admin.email}? The admin will need to set a new password before signing in again.`}
          confirmLabel="Send reset link"
          onClose={() => !isSubmitting && setResetOpen(false)}
          onConfirm={handleResetPassword}
        />

        <AdminConfirmModal
          open={suspendOpen}
          title={isSuspended ? 'Activate admin' : 'Suspend admin'}
          message={
            isSuspended
              ? `Reactivate ${admin.first_name} ${admin.last_name}? They will be able to sign in again.`
              : `Suspend ${admin.first_name} ${admin.last_name}? They will lose access to the Command Center until reactivated.`
          }
          confirmLabel={isSuspended ? 'Activate' : 'Suspend'}
          danger={!isSuspended}
          onClose={() => !isSubmitting && setSuspendOpen(false)}
          onConfirm={handleSuspendToggle}
        />

        <AdminActivityDetailModal
          open={!!selectedLog}
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      </div>
    </AdminManagementGate>
  );
}

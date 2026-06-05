'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaKey,
  FaCheckCircle,
} from 'react-icons/fa';
import '@/styles/adminUserDetails.css';
import '@/styles/adminAdminDetails.css';
import '@/styles/adminAdmins.css';
import '@/styles/adminShared.css';
import { AdminFormModal } from '@/components/admin/admins/AdminFormModal';
import { AdminConfirmModal } from '@/components/admin/admins/AdminConfirmModal';
import { deleteAdmin, resetAdminPassword, updateAdmin } from '@/data/adminManagementMock';
import { useAdminDetailStore } from '@/hooks/useAdminManagementStore';
import type { AdminFormValues } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS } from '@/types/adminManagement';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';
import { formatAdminRole, getRolePillClass } from '@/utils/adminRoleDisplay';

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams<{ adminId: string }>();
  const adminId = params?.adminId ?? '';
  const { admin, logs } = useAdminDetailStore(adminId);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const editInitial = useMemo<AdminFormValues | undefined>(() => {
    if (!admin) return undefined;
    return {
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
    };
  }, [admin]);

  if (!admin) {
    return (
      <div className="admin_details_page">
        <button
          type="button"
          className="receipt_back"
          onClick={() => router.push('/command-center/admins')}
        >
          <FaArrowLeft /> Back to admins
        </button>
        <div className="admin_panel_card not_found">
          <p>Admin not found.</p>
          <p className="hint" style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            Try: james-okafor, sarah-mendes, tunde-adeyemi, chioma-eze, david-okon
          </p>
        </div>
      </div>
    );
  }

  const handleUpdate = (values: AdminFormValues) => {
    updateAdmin(admin.id, values);
    setBanner(`${values.first_name} ${values.last_name} was updated successfully.`);
    setFormOpen(false);
  };

  const handleDelete = () => {
    deleteAdmin(admin.id);
    router.push('/command-center/admins');
  };

  const handleResetPassword = () => {
    resetAdminPassword(admin.id);
    setBanner(`Password reset email sent to ${admin.email} successfully.`);
    setResetOpen(false);
  };

  return (
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
            <h1>
              {admin.first_name} {admin.last_name}
            </h1>
            <p>{admin.email}</p>
            <p>{admin.phone}</p>
            <span className={`pill ${getRolePillClass(admin.role)}`}>
              {formatAdminRole(admin.role)}
            </span>
            <span
              className={`pill ${admin.status === 'active' ? 'pill_active' : 'pill_suspended'}`}
            >
              {admin.status}
            </span>
          </div>
        </div>
        <div className="profile_actions">
          <button type="button" className="action_edit" onClick={() => setFormOpen(true)}>
            <FaEdit /> Update
          </button>
          <button type="button" className="action_reset" onClick={() => setResetOpen(true)}>
            <FaKey /> Reset password
          </button>
          <button type="button" className="action_delete" onClick={() => setDeleteOpen(true)}>
            <FaTrash /> Delete
          </button>
        </div>
      </header>

      <dl className="overview_grid">
        <div className="overview_item">
          <dt>Admin ID</dt>
          <dd>{admin.id}</dd>
        </div>
        <div className="overview_item">
          <dt>Role</dt>
          <dd>{ADMIN_ROLE_LABELS[admin.role]}</dd>
        </div>
        <div className="overview_item">
          <dt>Created</dt>
          <dd>{admin.created_at}</dd>
        </div>
        <div className="overview_item">
          <dt>Created by</dt>
          <dd>{admin.created_by ?? '—'}</dd>
        </div>
        <div className="overview_item">
          <dt>Last login</dt>
          <dd>{admin.last_login}</dd>
        </div>
        <div className="overview_item">
          <dt>Status</dt>
          <dd style={{ textTransform: 'capitalize' }}>{admin.status}</dd>
        </div>
      </dl>

      <section className="tabs_container logs_section">
        <h2>Admin logs</h2>
        {logs.length > 0 ? (
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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.detail}</td>
                  <td>{log.timestamp}</td>
                  <td>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty_fallback">No activity logs for this admin yet.</p>
        )}
      </section>

      <AdminFormModal
        open={formOpen}
        mode="edit"
        initial={editInitial}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdate}
      />

      <AdminConfirmModal
        open={deleteOpen}
        title="Delete admin"
        message={`Remove ${admin.first_name} ${admin.last_name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <AdminConfirmModal
        open={resetOpen}
        title="Reset password"
        message={`Send a password reset link to ${admin.email}? The admin will need to set a new password before signing in again.`}
        confirmLabel="Send reset link"
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetPassword}
      />
    </div>
  );
}

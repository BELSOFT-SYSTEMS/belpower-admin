'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaUserPlus,
  FaUsers,
  FaUserShield,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaBan,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminUsers.css';
import '@/styles/adminAdmins.css';
import '@/styles/adminShared.css';
import { AdminFormModal } from '@/components/admin/admins/AdminFormModal';
import { AdminConfirmModal } from '@/components/admin/admins/AdminConfirmModal';
import { AdminManagementGate } from '@/components/admin/admins/AdminManagementGate';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminAdminsList } from '@/hooks/useAdminAdminsList';
import {
  deleteAdminAccount,
  formValuesToRegisterPayload,
  formValuesToUpdatePayload,
  registerAdmin,
  setAdminAccountStatus,
  updateAdminProfile,
} from '@/lib/adminAdmins';
import { AuthApiError } from '@/lib/adminAuth';
import type { AdminAccount, AdminFormValues, AdminRole } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS } from '@/types/adminManagement';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';
import { formatAdminRole, getRolePillClass } from '@/utils/adminRoleDisplay';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import {
  canCreateAdminAccount,
  canDeleteAdminAccount,
  canEditAdminAccount,
  canSuspendAdminAccount,
  filterAdminsVisibleToActor,
  getCreatableAdminRoles,
  getEditableAdminRoles,
} from '@/utils/adminManagementAccess';

const FILTER_ALL = '__all__';

export default function AdminsPage() {
  const { admin: actor } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{
    admin: AdminAccount;
    nextStatus: 'active' | 'suspended';
  } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { admins: fetchedAdmins, isLoading, error, refresh } = useAdminAdminsList({
    search: debouncedSearch,
    limit: 100,
  });

  const admins = useMemo(
    () => filterAdminsVisibleToActor(actor, fetchedAdmins),
    [actor, fetchedAdmins]
  );

  const creatableRoles = useMemo(() => getCreatableAdminRoles(actor), [actor]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesRole = roleFilter === FILTER_ALL || admin.role === roleFilter;
      const matchesStatus =
        statusFilter === FILTER_ALL || admin.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [admins, roleFilter, statusFilter]);

  const activeCount = admins.filter((a) => a.status === 'active').length;
  const superCount = admins.filter((a) => a.role === 'super_admin').length;

  const stats = [
    {
      icon: <FaUsers className="text-blue-500 text-xl" />,
      label: 'Total admins',
      value: String(admins.length),
      border: 'border-blue-200',
    },
    {
      icon: <FaUserShield className="text-purple-500 text-xl" />,
      label: 'Super admins',
      value: String(superCount),
      border: 'border-purple-200',
    },
    {
      icon: <FaCheckCircle className="text-green-500 text-xl" />,
      label: 'Active',
      value: String(activeCount),
      border: 'border-green-200',
    },
    {
      icon: <FaUserPlus className="text-orange-500 text-xl" />,
      label: 'Suspended',
      value: String(admins.length - activeCount),
      border: 'border-orange-200',
    },
  ];

  const openCreate = () => {
    setFormMode('create');
    setEditingAdmin(null);
    setFormOpen(true);
  };

  const openEdit = (admin: AdminAccount) => {
    setFormMode('edit');
    setEditingAdmin(admin);
    setFormOpen(true);
  };

  const handleActionError = (err: unknown, fallback: string) => {
    if (err instanceof AuthApiError) {
      setActionError(err.message);
    } else if (err instanceof Error) {
      setActionError(err.message);
    } else {
      setActionError(fallback);
    }
  };

  const handleFormSubmit = async (values: AdminFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (formMode === 'create') {
        const created = await registerAdmin(formValuesToRegisterPayload(values));
        setBanner(`${created.first_name} ${created.last_name} was created. A setup email was sent.`);
        setFormOpen(false);
      } else if (editingAdmin) {
        await updateAdminProfile(
          editingAdmin.id,
          formValuesToUpdatePayload(values, {
            includeRole: getEditableAdminRoles(actor, editingAdmin).length > 0,
          })
        );
        setBanner(`${values.first_name} ${values.last_name} was updated successfully.`);
        setFormOpen(false);
        setEditingAdmin(null);
      }
      await refresh();
    } catch (err) {
      handleActionError(err, 'Failed to save admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const name = `${deleteTarget.first_name} ${deleteTarget.last_name}`;
      await deleteAdminAccount(deleteTarget.id);
      setBanner(`${name} was deleted successfully.`);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      handleActionError(err, 'Failed to delete admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!suspendTarget) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const { admin, nextStatus } = suspendTarget;
      await setAdminAccountStatus(admin.id, nextStatus);
      const verb = nextStatus === 'suspended' ? 'suspended' : 'activated';
      setBanner(`${admin.first_name} ${admin.last_name} was ${verb} successfully.`);
      setSuspendTarget(null);
      await refresh();
    } catch (err) {
      handleActionError(err, 'Failed to update admin status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const editInitial: AdminFormValues | undefined = editingAdmin
    ? {
        first_name: editingAdmin.first_name,
        last_name: editingAdmin.last_name,
        email: editingAdmin.email,
        phone: editingAdmin.phone,
        role: editingAdmin.role,
        status: editingAdmin.status,
      }
    : undefined;

  const formRoleOptions =
    formMode === 'create'
      ? creatableRoles
      : editingAdmin
        ? getEditableAdminRoles(actor, editingAdmin)
        : creatableRoles;

  return (
    <AdminManagementGate>
      <div className="admins_page">
        <h1>Admin Management</h1>

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

        <section className="stats_section">
          {stats.map((stat, idx) => (
            <div key={idx} className={`${stat.border} stats_card`}>
              <div className="stats_header">
                <p>{stat.label}</p>
                {stat.icon}
              </div>
              <h2>{stat.value}</h2>
            </div>
          ))}
        </section>

        <section>
          <div className="manage_header manage_header_tools">
            <div className="manage_header_actions">
              <div className="search_container">
                <input
                  type="text"
                  placeholder="Search name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch />
              </div>
              {canCreateAdminAccount(actor) && (
                <button type="button" className="btn_create_admin" onClick={openCreate}>
                  <FaUserPlus /> Create admin
                </button>
              )}
            </div>
          </div>

          <div className="admin_filter_row">
            <AdminDropdown
              variant="filter"
              value={roleFilter}
              onChange={setRoleFilter}
              aria-label="Filter by role"
              options={[
                { value: FILTER_ALL, label: 'All roles' },
                ...(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((role) => ({
                  value: role,
                  label: ADMIN_ROLE_LABELS[role],
                })),
              ]}
            />
            <AdminDropdown
              variant="filter"
              value={statusFilter}
              onChange={setStatusFilter}
              aria-label="Filter by status"
              options={[
                { value: FILTER_ALL, label: 'All status' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'pending', label: 'Pending' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          {isLoading ? (
            <div className="empty_fallback" style={{ padding: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={20} />
              Loading admins…
            </div>
          ) : error ? (
            <p className="empty_fallback" style={{ padding: '2rem' }}>
              {error}
            </p>
          ) : (
            <div className="admin_txn_list">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => {
                  const showEdit = canEditAdminAccount(actor, admin);
                  const showDelete = canDeleteAdminAccount(actor, admin);
                  const showSuspend = canSuspendAdminAccount(actor, admin);
                  const isSuspended = admin.status === 'suspended';

                  return (
                    <div key={admin.id} className="admin_user_row">
                      <Link
                        href={`/command-center/admins/${admin.id}`}
                        className="admin_user_row_link"
                      >
                        <div
                          className="admin_user_avatar_initials"
                          aria-hidden
                          style={{ backgroundColor: getAvatarBackground(admin.id) }}
                        >
                          {getUserInitials(admin.first_name, admin.last_name)}
                        </div>
                        <div className="admin_user_info">
                          <div className="admin_user_name_row">
                            <span className="admin_user_name">
                              {admin.first_name} {admin.last_name}
                            </span>
                            <span className={`pill ${getRolePillClass(admin.role)}`}>
                              {formatAdminRole(admin.role)}
                            </span>
                          </div>
                          <div className="admin_user_email">{admin.email}</div>
                        </div>
                      </Link>
                      <div className="admin_user_meta">
                        {(showEdit || showDelete || showSuspend) && (
                          <div className="admin_row_actions" role="group" aria-label="Admin actions">
                            {showEdit && (
                              <button
                                type="button"
                                className="admin_row_action action_edit"
                                title="Edit"
                                aria-label="Edit"
                                onClick={() => openEdit(admin)}
                              >
                                <FaEdit />
                              </button>
                            )}
                            {showSuspend && (
                              <button
                                type="button"
                                className={`admin_row_action ${isSuspended ? 'action_activate' : 'action_suspend'}`}
                                title={isSuspended ? 'Activate' : 'Suspend'}
                                aria-label={isSuspended ? 'Activate' : 'Suspend'}
                                onClick={() =>
                                  setSuspendTarget({
                                    admin,
                                    nextStatus: isSuspended ? 'active' : 'suspended',
                                  })
                                }
                              >
                                {isSuspended ? <FaCheckCircle /> : <FaBan />}
                              </button>
                            )}
                            {showDelete && (
                              <button
                                type="button"
                                className="admin_row_action action_delete"
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => setDeleteTarget(admin)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        )}
                        <Link
                          href={`/command-center/admins/${admin.id}`}
                          className="admin_user_meta_link"
                        >
                          <div className="admin_user_meta_pills">
                            <span
                              className={`pill ${admin.status === 'active' ? 'pill_active' : 'pill_suspended'}`}
                            >
                              {admin.status}
                            </span>
                          </div>
                          <p className="admin_user_last_active">Last login: {admin.last_login}</p>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty_fallback" style={{ padding: '2rem' }}>
                  No admins found.
                </p>
              )}
            </div>
          )}
        </section>

        <AdminFormModal
          open={formOpen}
          mode={formMode}
          initial={editInitial}
          roleOptions={formRoleOptions}
          onClose={() => {
            if (!isSubmitting) {
              setFormOpen(false);
              setEditingAdmin(null);
            }
          }}
          onSubmit={handleFormSubmit}
        />

        <AdminConfirmModal
          open={!!deleteTarget}
          title="Delete admin"
          message={
            deleteTarget
              ? `Remove ${deleteTarget.first_name} ${deleteTarget.last_name}? This cannot be undone.`
              : ''
          }
          confirmLabel="Delete"
          danger
          onClose={() => !isSubmitting && setDeleteTarget(null)}
          onConfirm={handleDelete}
        />

        <AdminConfirmModal
          open={!!suspendTarget}
          title={suspendTarget?.nextStatus === 'suspended' ? 'Suspend admin' : 'Activate admin'}
          message={
            suspendTarget
              ? suspendTarget.nextStatus === 'suspended'
                ? `Suspend ${suspendTarget.admin.first_name} ${suspendTarget.admin.last_name}? They will lose access to the Command Center until reactivated.`
                : `Reactivate ${suspendTarget.admin.first_name} ${suspendTarget.admin.last_name}? They will be able to sign in again.`
              : ''
          }
          confirmLabel={suspendTarget?.nextStatus === 'suspended' ? 'Suspend' : 'Activate'}
          danger={suspendTarget?.nextStatus === 'suspended'}
          onClose={() => !isSubmitting && setSuspendTarget(null)}
          onConfirm={handleSuspendToggle}
        />
      </div>
    </AdminManagementGate>
  );
}

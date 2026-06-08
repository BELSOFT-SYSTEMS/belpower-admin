'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaUserPlus,
  FaUsers,
  FaUserShield,
  FaSearch,
  FaEdit,
  FaTrash,
  FaCheckCircle,
} from 'react-icons/fa';
import '@/styles/adminUsers.css';
import '@/styles/adminAdmins.css';
import '@/styles/adminShared.css';
import { AdminFormModal } from '@/components/admin/admins/AdminFormModal';
import { AdminConfirmModal } from '@/components/admin/admins/AdminConfirmModal';
import {
  createAdmin,
  deleteAdmin,
  updateAdmin,
} from '@/data/adminManagementMock';
import { useAdminManagementStore } from '@/hooks/useAdminManagementStore';
import type { AdminAccount, AdminFormValues, AdminRole } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS } from '@/types/adminManagement';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';
import { formatAdminRole, getRolePillClass } from '@/utils/adminRoleDisplay';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';

const FILTER_ALL = '__all__';

export default function AdminsPage() {
  const admins = useAdminManagementStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(FILTER_ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const filteredAdmins = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return admins.filter((admin) => {
      const matchesSearch =
        !q ||
        admin.first_name.toLowerCase().includes(q) ||
        admin.last_name.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === FILTER_ALL || admin.role === roleFilter;
      const matchesStatus =
        statusFilter === FILTER_ALL || admin.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchTerm, roleFilter, statusFilter]);

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

  const handleFormSubmit = (values: AdminFormValues) => {
    if (formMode === 'create') {
      const created = createAdmin(values);
      setBanner(`${created.first_name} ${created.last_name} was created successfully.`);
      setFormOpen(false);
      return;
    }
    if (editingAdmin) {
      updateAdmin(editingAdmin.id, values);
      setBanner(`${values.first_name} ${values.last_name} was updated successfully.`);
      setFormOpen(false);
      setEditingAdmin(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const name = `${deleteTarget.first_name} ${deleteTarget.last_name}`;
    deleteAdmin(deleteTarget.id);
    setBanner(`${name} was deleted successfully.`);
    setDeleteTarget(null);
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

  return (
    <div className="admins_page">
      <h1>Admin Management</h1>

      {banner && (
        <div className="settings_banner settings_banner_success" role="status">
          <FaCheckCircle style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{banner}</span>
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
        <div className="manage_header">
          <h2>All admins</h2>
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
            <button type="button" className="btn_create_admin" onClick={openCreate}>
              <FaUserPlus /> Create admin
            </button>
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
            ]}
          />
        </div>

        <div className="admin_txn_list">
          {filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
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
                    <div className="admin_user_name">
                      {admin.first_name} {admin.last_name}
                    </div>
                    <div className="admin_user_email">{admin.email}</div>
                  </div>
                </Link>
                <div className="admin_user_meta">
                  <div className="admin_row_actions" role="group" aria-label="Admin actions">
                    <button
                      type="button"
                      className="admin_row_action action_edit"
                      title="Edit"
                      aria-label="Edit"
                      onClick={() => openEdit(admin)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="admin_row_action action_delete"
                      title="Delete"
                      aria-label="Delete"
                      onClick={() => setDeleteTarget(admin)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <Link
                    href={`/command-center/admins/${admin.id}`}
                    className="admin_user_meta_link"
                  >
                    <span className={`pill ${getRolePillClass(admin.role)}`}>
                      {formatAdminRole(admin.role)}
                    </span>
                    <span
                      className={`pill ${admin.status === 'active' ? 'pill_active' : 'pill_suspended'}`}
                    >
                      {admin.status}
                    </span>
                    <p className="admin_user_last_active">Last login: {admin.last_login}</p>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="empty_fallback" style={{ padding: '2rem' }}>
              No admins found.
            </p>
          )}
        </div>
      </section>

      <AdminFormModal
        open={formOpen}
        mode={formMode}
        initial={editInitial}
        onClose={() => {
          setFormOpen(false);
          setEditingAdmin(null);
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
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

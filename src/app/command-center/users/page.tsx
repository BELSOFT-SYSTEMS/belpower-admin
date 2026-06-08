'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaUserPlus,
  FaUserCheck,
  FaUserSlash,
  FaSearch,
  FaExclamationTriangle,
  FaEnvelope,
  FaBan,
} from 'react-icons/fa';
import '@/styles/adminUsers.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { MOCK_USERS_LIST } from '@/data/adminMockData';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';

const userStats = [
  {
    icon: <FaUserPlus className="text-green-500 text-xl" />,
    label: 'New users',
    value: '247',
    sub: 'Last 7 days',
    border: 'border-green-200',
  },
  {
    icon: <FaUserCheck className="text-blue-500 text-xl" />,
    label: 'Active users',
    value: '1,240',
    sub: 'Currently online',
    border: 'border-blue-200',
  },
  {
    icon: <FaUserSlash className="text-orange-500 text-xl" />,
    label: 'Flagged users',
    value: '18',
    sub: 'Suspicious activity',
    border: 'border-orange-200',
  },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return MOCK_USERS_LIST.filter((user) => {
      const matchesSearch =
        !q ||
        user.first_name.toLowerCase().includes(q) ||
        user.last_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === '__all__'
          ? true
          : statusFilter === 'suspicious'
            ? user.suspicious_activity
            : user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="users_page">
      <h1>Users</h1>

      <section className="stats_section">
        {userStats.map((stat, idx) => (
          <div key={idx} className={`${stat.border} stats_card`}>
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
            options={[
              { value: '__all__', label: 'All status' },
              { value: 'active', label: 'Active' },
              { value: 'new', label: 'New' },
              { value: 'dormant', label: 'Dormant' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'suspicious', label: 'Suspicious only' },
            ]}
          />
        </div>

        <div className="admin_txn_list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="admin_user_row">
                <Link
                  href={`/command-center/users/${user.id}`}
                  className="admin_user_row_link"
                >
                  <div
                    className="admin_user_avatar_initials"
                    aria-hidden
                    style={{ backgroundColor: getAvatarBackground(user.id) }}
                  >
                    {getUserInitials(user.first_name, user.last_name)}
                  </div>
                  <div className="admin_user_info">
                    <div className="admin_user_name">
                      {user.first_name} {user.last_name}
                      {user.suspicious_activity && (
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
                  <div
                    className="user_list_quick_actions"
                    role="group"
                    aria-label={`Quick actions for ${user.first_name} ${user.last_name}`}
                  >
                    <button
                      type="button"
                      className="user_quick_action action_message"
                      title="Message"
                      aria-label="Message"
                    >
                      <FaEnvelope />
                    </button>
                    <button
                      type="button"
                      className="user_quick_action action_suspend"
                      title="Suspend"
                      aria-label="Suspend"
                    >
                      <FaUserSlash />
                    </button>
                    <button
                      type="button"
                      className="user_quick_action action_block"
                      title="Block"
                      aria-label="Block"
                    >
                      <FaBan />
                    </button>
                    <button
                      type="button"
                      className="user_quick_action action_activate"
                      title="Activate"
                      aria-label="Activate"
                    >
                      <FaUserCheck />
                    </button>
                  </div>
                  <Link
                    href={`/command-center/users/${user.id}`}
                    className="admin_user_meta_link"
                  >
                    <span className={`pill pill_${user.status}`}>{user.status}</span>
                    <p className="admin_user_last_active">{user.last_active}</p>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="empty_fallback" style={{ padding: '2rem' }}>
              No users found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

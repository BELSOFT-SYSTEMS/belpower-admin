'use client';

import { useState, useMemo } from 'react';
import { TbCancel } from 'react-icons/tb';
import { FaUserPlus, FaUserCheck, FaUserSlash, FaTrashAlt, FaSearch } from 'react-icons/fa';
import '@/styles/adminUsers.css';

const userStats = [
  {
    icon: <FaUserPlus className="text-green-500 text-xl" />,
    label: 'New Users',
    value: '247',
    sub: 'Last 7 days',
    border: 'border-green-200',
  },
  {
    icon: <FaUserCheck className="text-blue-500 text-xl" />,
    label: 'Active Users',
    value: '1,240',
    sub: 'Currently Online',
    border: 'border-blue-200',
  },
  {
    icon: <FaUserSlash className="text-orange-500 text-xl" />,
    label: 'Dormant Users',
    value: '892',
    sub: 'Inactive >30 days',
    border: 'border-orange-200',
  },
];

const allUsers = [
  {
    name: 'John Travis',
    email: 'johntravis@gmail.com',
    avatar: '/Profile.png',
    status: 'Active',
    lastActive: '2 mins ago',
  },
  {
    name: 'Michael Essien',
    email: 'mikeessien@gmail.com',
    avatar: '/Profile.png',
    status: 'Dormant',
    lastActive: '2 months ago',
  },
  {
    name: 'Debbie Sam',
    email: 'debbiesam@gmail.com',
    avatar: '/Profile.png',
    status: 'New',
    lastActive: 'Just joined',
  },
  {
    name: 'Chris Paul',
    email: 'chrispaul@gmail.com',
    avatar: '/Profile.png',
    status: 'Active',
    lastActive: '5 mins ago',
  },
  {
    name: 'Anita Bose',
    email: 'anitabose@gmail.com',
    avatar: '/Profile.png',
    status: 'Dormant',
    lastActive: '3 months ago',
  },
  {
    name: 'Tony Lee',
    email: 'tonylee@gmail.com',
    avatar: '/Profile.png',
    status: 'New',
    lastActive: 'Just joined',
  },
];

const statusColorMap = {
  Active: 'success_color',
  Dormant: 'pending_color',
  New: 'color_purple',
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const filteredUsers = useMemo(() => {
    return allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="users_page">
      <h1>Users</h1>

      {/* Stat Cards */}
      <section className="stats_section">
        {userStats.length > 0 ? (
          userStats.map((stat, idx) => (
            <div key={idx} className={` ${stat.border} stats_card`}>
              <div className="stats_header">
                <p>{stat.label}</p>
                {stat.icon}
              </div>
              <div className="stats_bottom">
                <h2>{stat.value}</h2>
                <p>{stat.sub}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty_fallback">No stats available</p>
        )}
      </section>

      <section>
        {/* Manage Users Header */}
        <div className="manage_header">
          <h2>Manage Users</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search Users"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <FaSearch />
          </div>
        </div>

        {/* Users Table */}
        <div className="table_container">
          <table>
            <thead>
              <tr>
                <th className="py-2">User</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty_fallback">
                    No users found.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user, idx) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="avatar_container">
                        <img src={user.avatar} alt="avatar" />
                        <div>
                          <p className="name">{user.name}</p>
                          <p className="email">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`transaction_status ${
                          statusColorMap[user.status as keyof typeof statusColorMap]
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastActive}</td>
                    <td>
                      <div className="user_actions">
                        <button title="Suspend" className="suspend">
                          <FaUserSlash /> Suspend
                        </button>
                        <button title="Deactivate" className="deactivate">
                          <TbCancel /> Deactivate
                        </button>
                        <button title="Delete" className="delete">
                          <FaTrashAlt /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="pagination_section">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="pagination_btn"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`current ${currentPage === idx + 1 ? 'btn_active' : 'btn_inactive'}`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="pagination_btn"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </section>
      )}
    </div>
  );
}

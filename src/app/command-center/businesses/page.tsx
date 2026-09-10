'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaBuilding, FaSearch, FaCheckCircle, FaBan, FaMinusCircle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminUsers.css';
import '@/styles/adminPartners.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { getBusinessesList } from '@/lib/adminBusinesses';
import type { BusinessListItem, BusinessesPageStats } from '@/types/adminBusinesses';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import { getAvatarBackground, getInitialsFromDisplayName } from '@/utils/userAvatar';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';

function statusClass(status: string) {
  if (status === 'active') return 'status_active';
  if (status === 'suspended') return 'status_blocked';
  return 'status_inactive';
}

export default function BusinessesPage() {
  const { refreshKey } = useAdminAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [page, setPage] = useState(1);
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [stats, setStats] = useState<BusinessesPageStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBusinessesList({
          page,
          limit: 20,
          search: debouncedSearch,
          status: statusFilter,
        });
        if (cancelled) return;
        setBusinesses(data.businesses || []);
        if (data.stats) setStats(data.stats);
        setPagination(data.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load businesses');
        setBusinesses([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, statusFilter, refreshKey]);

  return (
    <div className="admin_users_page">
      <div className="admin_users_header">
        <div>
          <h1 className="admin_users_title">BelPower Business</h1>
          <p className="admin_users_subtitle">Track registered businesses, wallets, and spend.</p>
        </div>
      </div>

      {stats ? (
        <div className="admin_users_stats_grid">
          <div className="admin_stat_card">
            <FaBuilding className="admin_stat_icon" />
            <div>
              <p className="admin_stat_label">Total</p>
              <p className="admin_stat_value">{stats.total}</p>
            </div>
          </div>
          <div className="admin_stat_card">
            <FaCheckCircle className="admin_stat_icon text-green-600" />
            <div>
              <p className="admin_stat_label">Active</p>
              <p className="admin_stat_value">{stats.active}</p>
            </div>
          </div>
          <div className="admin_stat_card">
            <FaBan className="admin_stat_icon text-red-600" />
            <div>
              <p className="admin_stat_label">Suspended</p>
              <p className="admin_stat_value">{stats.suspended}</p>
            </div>
          </div>
          <div className="admin_stat_card">
            <FaMinusCircle className="admin_stat_icon text-gray-500" />
            <div>
              <p className="admin_stat_label">Inactive</p>
              <p className="admin_stat_value">{stats.inactive}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin_users_toolbar">
        <div className="admin_users_search">
          <FaSearch className="admin_users_search_icon" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search business name, code, email, phone…"
          />
        </div>
        <AdminDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '__all__', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {error ? <p className="admin_users_error">{error}</p> : null}

      <div className="admin_users_table_wrap">
        {isLoading ? (
          <div className="admin_users_loading">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading businesses…</span>
          </div>
        ) : businesses.length === 0 ? (
          <p className="admin_users_empty">No businesses found.</p>
        ) : (
          <table className="admin_users_table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Status</th>
                <th>Users</th>
                <th>Branches</th>
                <th>Company wallet</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id}>
                  <td>
                    <Link
                      href={`/command-center/businesses/${business.id}`}
                      className="admin_users_user_link"
                    >
                      <span
                        className="admin_users_avatar"
                        style={{
                          backgroundColor: getAvatarBackground(business.id),
                          color: '#fff',
                        }}
                      >
                        {getInitialsFromDisplayName(business.businessName)}
                      </span>
                      <span>
                        <span className="admin_users_name">{business.businessName}</span>
                        <span className="admin_users_email">
                          {business.businessId} · {business.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className={`status_pill ${statusClass(business.status)}`}>
                      {business.status}
                    </span>
                  </td>
                  <td>{business.userCount}</td>
                  <td>{business.branchCount}</td>
                  <td>{formatPrice(business.companyBalance)}</td>
                  <td>{business.createdAt ? formatAdminDateTime(business.createdAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="admin_users_pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

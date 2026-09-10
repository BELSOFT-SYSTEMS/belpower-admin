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

function businessStatusPill(status: string) {
  if (status === 'active') return 'pill pill_active';
  if (status === 'suspended') return 'pill pill_suspended';
  return 'pill pill_inactive';
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

  const totalPages = pagination.totalPages || 1;

  const statCards = stats
    ? [
        {
          key: 'total',
          icon: <FaBuilding className="text-indigo-500 text-xl" />,
          label: 'Total businesses',
          value: stats.total.toLocaleString(),
          sub: 'Registered companies',
          border: 'border-indigo-200',
        },
        {
          key: 'active',
          icon: <FaCheckCircle className="text-green-500 text-xl" />,
          label: 'Active',
          value: stats.active.toLocaleString(),
          sub: 'Can fund and pay',
          border: 'border-green-200',
        },
        {
          key: 'suspended',
          icon: <FaBan className="text-red-500 text-xl" />,
          label: 'Suspended',
          value: stats.suspended.toLocaleString(),
          sub: 'Temporarily blocked',
          border: 'border-red-200',
        },
        {
          key: 'inactive',
          icon: <FaMinusCircle className="text-gray-500 text-xl" />,
          label: 'Inactive',
          value: stats.inactive.toLocaleString(),
          sub: 'Not currently active',
          border: 'border-gray-200',
        },
      ]
    : [];

  return (
    <div className="users_page partners_page">
      <h1>BelPower Business</h1>

      {statCards.length > 0 ? (
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
      ) : null}

      <section>
        <div className="manage_header">
          <h2>All businesses</h2>
          <div className="search_container">
            <input
              type="text"
              placeholder="Search business name, code, email, phone…"
              value={searchTerm}
              maxLength={128}
              onChange={(event) => setSearchTerm(event.target.value)}
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
            options={[
              { value: '__all__', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="users_page_loading">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p>Loading businesses…</p>
          </div>
        ) : error ? (
          <div className="users_page_error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="admin_txn_list">
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <div key={business.id} className="admin_user_row">
                    <Link
                      href={`/command-center/businesses/${business.id}`}
                      className="admin_user_row_link"
                    >
                      <div
                        className="admin_user_avatar_initials"
                        aria-hidden
                        style={{ backgroundColor: getAvatarBackground(business.id) }}
                      >
                        {getInitialsFromDisplayName(business.businessName)}
                      </div>
                      <div className="admin_user_info">
                        <div className="admin_user_name">
                          {business.businessName}
                          <span className={businessStatusPill(business.status)}>
                            {business.status}
                          </span>
                        </div>
                        <div className="admin_user_email">
                          {business.businessId} · {business.email}
                        </div>
                      </div>
                    </Link>

                    <div className="admin_user_meta">
                      <div className="partner_list_meta_values">
                        <span>
                          {business.userCount} users · {business.branchCount} branches
                        </span>
                        <span>{formatPrice(business.companyBalance)}</span>
                        <span>
                          {business.createdAt ? formatAdminDateTime(business.createdAt) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty_fallback">No businesses found for the current filters.</p>
              )}
            </div>

            <div className="users_pagination_bar">
              <p className="users_pagination_meta">
                Page {pagination.page} of {totalPages} · {pagination.total.toLocaleString()}{' '}
                businesses
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
    </div>
  );
}

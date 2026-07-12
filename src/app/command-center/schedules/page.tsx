'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminUsers.css';
import '@/styles/adminSchedules.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminSchedulesList } from '@/hooks/useAdminSchedulesList';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import {
  formatPauseReason,
  formatScheduleStatusLabel,
  formatServiceTypeLabel,
  scheduleStatusClass,
} from '@/utils/adminScheduleDisplay';

const STATUS_OPTIONS = [
  { value: '__all__', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SERVICE_OPTIONS = [
  { value: '__all__', label: 'All services' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Data' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'cable', label: 'Cable TV' },
];

export default function SchedulesPage() {
  const { canAccess } = useAdminAuth();
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get('userId') ?? undefined;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [serviceFilter, setServiceFilter] = useState('__all__');
  const [page, setPage] = useState(1);

  const { schedules, pagination, isLoading, error, refresh } = useAdminSchedulesList({
    search: searchTerm,
    statusFilter,
    serviceFilter,
    userId: userIdFilter,
    page,
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, serviceFilter, userIdFilter]);

  if (!canAccess('transactions.list')) {
    return (
      <AdminCriticalAlert
        title="Access denied"
        message="You do not have permission to view scheduled purchases."
        severity="high"
      />
    );
  }

  return (
    <div className="admin_page admin_schedules_page">
      <div className="admin_page_header">
        <div>
          <h1 className="admin_page_title">
            <FaCalendarAlt className="inline mr-2" />
            Scheduled Purchases
          </h1>
          <p className="admin_page_subtitle">
            Manage recurring bill schedules across all users.
            {userIdFilter ? ' Filtered by user.' : ''}
          </p>
        </div>
      </div>

      <div className="admin_filters_row">
        <div className="admin_search_wrap">
          <FaSearch className="admin_search_icon" />
          <input
            type="search"
            placeholder="Search recipient or provider…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin_search_input"
          />
        </div>
        <AdminDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          aria-label="Filter by status"
        />
        <AdminDropdown
          value={serviceFilter}
          onChange={setServiceFilter}
          options={SERVICE_OPTIONS}
          aria-label="Filter by service"
        />
      </div>

      {error && (
        <AdminCriticalAlert
          title="Failed to load schedules"
          message={error}
          severity="high"
        />
      )}

      <div className="admin_table_card">
        {isLoading ? (
          <div className="admin_loading_center">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : schedules.length === 0 ? (
          <div className="admin_empty_state">No scheduled purchases found.</div>
        ) : (
          schedules.map((schedule) => {
            const userName = schedule.user
              ? `${schedule.user.firstName} ${schedule.user.lastName}`.trim() || schedule.user.email
              : 'Unknown user';

            return (
              <Link
                key={schedule.id}
                href={`/command-center/schedules/${schedule.id}`}
                className="admin_schedule_row admin_row_link"
              >
                <div className="admin_schedule_meta">
                  <strong>{formatServiceTypeLabel(schedule.serviceType)}</strong>
                  <span>{schedule.serviceProvider} • {schedule.recipient}</span>
                  <span className="admin_schedule_user">{userName}</span>
                  {schedule.status === 'paused' && schedule.pauseReason ? (
                    <span className="admin_schedule_pause_reason">
                      {formatPauseReason(schedule.pauseReason)}
                    </span>
                  ) : null}
                </div>
                <div>{formatPrice(Number(schedule.amount))}</div>
                <div className="capitalize">{schedule.scheduleFrequency}</div>
                <div>{formatAdminDateTime(schedule.nextPurchase)}</div>
                <div>
                  <span className={scheduleStatusClass(schedule.status)}>
                    {formatScheduleStatusLabel(schedule.status)}
                  </span>
                </div>
                <div className="admin_row_chevron">›</div>
              </Link>
            );
          })
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="admin_pagination">
          <button
            type="button"
            className="btn_secondary"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn_secondary"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

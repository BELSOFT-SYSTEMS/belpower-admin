'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPause, FaPlay, FaTrash } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminSchedules.css';
import '@/styles/adminShared.css';
import { AdminConfirmModal } from '@/components/admin/admins/AdminConfirmModal';
import { AdminCriticalAlert } from '@/components/admin/ui/AdminCriticalAlert';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  cancelAdminSchedule,
  getScheduleDetail,
  getScheduleHistory,
  pauseAdminSchedule,
  resumeAdminSchedule,
} from '@/lib/adminSchedules';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import {
  formatPauseReason,
  formatScheduleStatusLabel,
  formatServiceTypeLabel,
  scheduleStatusClass,
} from '@/utils/adminScheduleDisplay';
import type { AdminBillSchedule, ScheduleHistoryItem } from '@/types/adminSchedules';

type PendingAction = 'pause' | 'resume' | 'cancel';

export default function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = use(params);
  const router = useRouter();
  const { canAccess } = useAdminAuth();

  const [schedule, setSchedule] = useState<AdminBillSchedule | null>(null);
  const [history, setHistory] = useState<ScheduleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detail, historyRows] = await Promise.all([
        getScheduleDetail(scheduleId),
        getScheduleHistory(scheduleId),
      ]);
      setSchedule(detail);
      setHistory(historyRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
      setSchedule(null);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async () => {
    if (!schedule || !pendingAction) return;
    setIsSubmitting(true);
    try {
      if (pendingAction === 'pause') {
        await pauseAdminSchedule(schedule.id);
        toast.success('Schedule paused');
      } else if (pendingAction === 'resume') {
        await resumeAdminSchedule(schedule.id);
        toast.success('Schedule resumed');
      } else {
        await cancelAdminSchedule(schedule.id);
        toast.success('Schedule cancelled');
        router.push('/command-center/schedules');
        return;
      }
      setPendingAction(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canAccess('transactions.list')) {
    return (
      <AdminCriticalAlert
        title="Access denied"
        message="You do not have permission to view this schedule."
        severity="danger"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="admin_loading_center" style={{ minHeight: '40vh' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <AdminCriticalAlert
        title="Schedule not found"
        message={error ?? 'This schedule could not be loaded.'}
        severity="danger"
      />
    );
  }

  const userName = schedule.user
    ? `${schedule.user.firstName} ${schedule.user.lastName}`.trim() || schedule.user.email
    : 'Unknown user';

  return (
    <div className="admin_page">
      <div className="admin_page_header">
        <Link href="/command-center/schedules" className="admin_back_link">
          <FaArrowLeft /> Back to schedules
        </Link>
        <div className="admin_page_header_actions">
          {schedule.status === 'active' && (
            <button type="button" className="btn_secondary" onClick={() => setPendingAction('pause')}>
              <FaPause className="inline mr-1" /> Pause
            </button>
          )}
          {schedule.status === 'paused' && (
            <button type="button" className="btn_secondary" onClick={() => setPendingAction('resume')}>
              <FaPlay className="inline mr-1" /> Resume
            </button>
          )}
          {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
            <button
              type="button"
              className="btn_danger"
              onClick={() => setPendingAction('cancel')}
            >
              <FaTrash className="inline mr-1" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="admin_detail_header">
        <h1>{formatServiceTypeLabel(schedule.serviceType)} schedule</h1>
        <span className={scheduleStatusClass(schedule.status)}>
          {formatScheduleStatusLabel(schedule.status)}
        </span>
      </div>

      <div className="admin_schedule_detail_grid">
        <div className="admin_schedule_detail_card">
          <h3>Amount</h3>
          <p>{formatPrice(Number(schedule.amount))}</p>
        </div>
        <div className="admin_schedule_detail_card">
          <h3>Frequency</h3>
          <p className="capitalize">{schedule.scheduleFrequency}</p>
        </div>
        <div className="admin_schedule_detail_card">
          <h3>Next run</h3>
          <p>{formatAdminDateTime(schedule.nextPurchase)}</p>
        </div>
        <div className="admin_schedule_detail_card">
          <h3>Provider / recipient</h3>
          <p>{schedule.serviceProvider}</p>
          <p>{schedule.recipient}</p>
        </div>
        {schedule.planName ? (
          <div className="admin_schedule_detail_card">
            <h3>Plan</h3>
            <p>{schedule.planName}</p>
          </div>
        ) : null}
        {schedule.pauseReason ? (
          <div className="admin_schedule_detail_card">
            <h3>Pause reason</h3>
            <p>{formatPauseReason(schedule.pauseReason)}</p>
          </div>
        ) : null}
        {schedule.lastError ? (
          <div className="admin_schedule_detail_card">
            <h3>Last error</h3>
            <p>{schedule.lastError}</p>
          </div>
        ) : null}
        <div className="admin_schedule_detail_card">
          <h3>User</h3>
          <p>{userName}</p>
          <p>{schedule.user?.email}</p>
          {schedule.user?.id ? (
            <Link href={`/command-center/users/${schedule.user.id}`} className="admin_inline_link">
              View user profile
            </Link>
          ) : null}
        </div>
        {schedule.transaction?.id ? (
          <div className="admin_schedule_detail_card">
            <h3>Linked transaction</h3>
            <p>{schedule.transaction.reference || schedule.transaction.orderId}</p>
            <Link
              href={`/command-center/transactions/${schedule.transaction.id}`}
              className="admin_inline_link"
            >
              View transaction
            </Link>
          </div>
        ) : null}
      </div>

      <div className="admin_section">
        <h2>Execution history</h2>
        {history.length === 0 ? (
          <p className="admin_muted">No execution history yet.</p>
        ) : (
          <table className="admin_schedule_history_table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Created</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/command-center/transactions/${item.id}`} className="admin_inline_link">
                      {item.reference || item.orderId || item.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>{item.status}</td>
                  <td>{formatPrice(Number(item.amount))}</td>
                  <td>{formatAdminDateTime(item.createdAt)}</td>
                  <td>{item.completedAt ? formatAdminDateTime(item.completedAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminConfirmModal
        open={pendingAction !== null}
        title={
          pendingAction === 'pause'
            ? 'Pause schedule'
            : pendingAction === 'resume'
              ? 'Resume schedule'
              : 'Cancel schedule'
        }
        message={
          pendingAction === 'pause'
            ? 'This schedule will stop running until resumed. The user will be notified.'
            : pendingAction === 'resume'
              ? 'This schedule will resume on its next run date.'
              : 'This will permanently cancel the schedule. This action cannot be undone.'
        }
        confirmLabel={pendingAction === 'cancel' ? 'Cancel schedule' : 'Confirm'}
        danger={pendingAction === 'cancel'}
        onClose={() => !isSubmitting && setPendingAction(null)}
        onConfirm={runAction}
      />
    </div>
  );
}

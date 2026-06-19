'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaExclamationTriangle, FaShieldAlt, FaUserSlash, FaSync } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminShared.css';
import '@/styles/adminFraudEvents.css';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { RunFraudScanModal } from '@/components/admin/fraud/RunFraudScanModal';
import {
  AdminBulkSelectToolbar,
  type AdminBulkAction,
} from '@/components/admin/ui/AdminBulkSelectToolbar';
import { AdminRowCheckbox } from '@/components/admin/ui/AdminRowCheckbox';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminFraudEvents } from '@/hooks/useAdminFraudEvents';
import { useFraudScanRunner } from '@/hooks/useFraudScanRunner';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { bulkReviewFraudEvents, reviewFraudEvent } from '@/lib/adminFraud';
import { formatPrice } from '@/utils/FormatPrice';
import { formatLastActive } from '@/utils/formatLastActive';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import {
  buildFraudEventsReturn,
  withAdminReturn,
} from '@/utils/adminReturnNavigation';
import type { FraudEvent, FraudReviewStatus, FraudSeverity } from '@/types/adminFraud';

const SEVERITY_OPTIONS: Array<{ value: FraudSeverity | ''; label: string }> = [
  { value: '', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const REVIEW_OPTIONS: Array<{ value: FraudReviewStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
];

function severityPillClass(severity: FraudSeverity): string {
  return `pill pill_severity_${severity}`;
}

function actionLabel(action: FraudEvent['actionTaken']): string {
  if (action === 'blocked_and_suspended') return 'Blocked + auto-suspended';
  if (action === 'flagged_only') return 'Flagged for review (test account)';
  if (action === 'detected') return 'Detected — flagged for review';
  return 'Blocked';
}

function FraudEventsContent() {
  const searchParams = useSearchParams();
  const { canAccess, admin } = useAdminAuth();
  const isSuperAdmin = Boolean(admin?.allAccess || admin?.role === 'super_admin');
  const eventIdParam = searchParams.get('eventId') ?? undefined;
  const userIdFilter = searchParams.get('userId') ?? undefined;

  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<FraudSeverity | ''>('');
  const [reviewFilter, setReviewFilter] = useState<FraudReviewStatus | ''>('open');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const {
    steps: scanSteps,
    isScanning: scanBusy,
    result: scanResult,
    error: scanError,
    run: runFraudScanFlow,
    reset: resetFraudScan,
  } = useFraudScanRunner();
  const [bulkBusy, setBulkBusy] = useState(false);

  const { events, pagination, stats, isLoading, error, refresh } = useAdminFraudEvents({
    page,
    severity: severityFilter || undefined,
    reviewStatus: reviewFilter || undefined,
    userId: userIdFilter,
  });

  useEffect(() => {
    setPage(1);
  }, [severityFilter, reviewFilter, userIdFilter]);

  useEffect(() => {
    if (eventIdParam) setSelectedEventId(eventIdParam);
  }, [eventIdParam]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const fraudEventsReturn = useMemo(() => {
    const params = new URLSearchParams();
    if (userIdFilter) params.set('userId', userIdFilter);
    if (eventIdParam) params.set('eventId', eventIdParam);
    return buildFraudEventsReturn(params.toString() || undefined);
  }, [userIdFilter, eventIdParam]);

  const canReview = canAccess('fraud.review');

  const selectableEventIds = useMemo(
    () => events.filter((event) => event.reviewStatus === 'open').map((event) => event.id),
    [events]
  );

  const {
    selectionMode,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    toggleSelectionMode,
    toggleItem,
    toggleSelectAll,
    isSelected,
    exitSelectionMode,
  } = useBulkSelection(selectableEventIds);

  const runBulkReview = useCallback(
    async (reviewStatus: 'reviewed' | 'dismissed') => {
      if (!canReview || selectedIds.length === 0) return;

      setBulkBusy(true);
      try {
        const result = await bulkReviewFraudEvents({
          eventIds: selectedIds,
          reviewStatus,
        });

        toast.success(
          `${result.updated} event${result.updated === 1 ? '' : 's'} ${
            reviewStatus === 'reviewed' ? 'marked reviewed' : 'dismissed'
          }`
        );

        if (result.failed.length > 0) {
          toast.warning(`${result.failed.length} event(s) could not be updated`);
        }

        exitSelectionMode();
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update events');
      } finally {
        setBulkBusy(false);
      }
    },
    [canReview, selectedIds, exitSelectionMode, refresh]
  );

  const bulkActions = useMemo<AdminBulkAction[]>(
    () => [
      {
        key: 'reviewed',
        label: 'Mark reviewed',
        variant: 'primary',
        onClick: () => runBulkReview('reviewed'),
      },
      {
        key: 'dismissed',
        label: 'Dismiss',
        onClick: () => runBulkReview('dismissed'),
      },
    ],
    [runBulkReview]
  );

  const filterControls = (
    <>
      <select
        value={severityFilter}
        onChange={(e) => setSeverityFilter(e.target.value as FraudSeverity | '')}
        aria-label="Filter by severity"
      >
        {SEVERITY_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={reviewFilter}
        onChange={(e) => setReviewFilter(e.target.value as FraudReviewStatus | '')}
        aria-label="Filter by review status"
      >
        {REVIEW_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );

  const handleEventRowClick = (event: FraudEvent) => {
    if (selectionMode) {
      if (event.reviewStatus === 'open') {
        toggleItem(event.id);
      }
      return;
    }
    setSelectedEventId(event.id);
  };

  const openScanModal = () => {
    resetFraudScan();
    setShowScanModal(true);
  };

  const closeScanModal = () => {
    if (scanBusy) return;
    setShowScanModal(false);
    resetFraudScan();
  };

  const handleRunScan = async () => {
    try {
      const result = await runFraudScanFlow();
      toast.success(
        `Fraud scan complete — ${result.created} new event${result.created === 1 ? '' : 's'}`
      );
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run fraud scan';
      toast.error(message);
    }
  };

  const handleReview = async (reviewStatus: 'reviewed' | 'dismissed') => {
    if (!selectedEvent || !canReview) return;

    setReviewBusy(true);
    setReviewError(null);

    try {
      await reviewFraudEvent(selectedEvent.id, {
        reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setReviewNotes('');
      await refresh();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setReviewBusy(false);
    }
  };

  if (!canAccess('fraud.view')) {
    return (
      <div className="fraud_events_page">
        <h1>Fraud Events</h1>
        <p className="empty_fallback">You do not have access to fraud events.</p>
      </div>
    );
  }

  return (
    <div className="fraud_events_page">
      <header className="fraud_events_header">
        <div>
          <h1>Fraud Events</h1>
          <p className="fraud_events_subtitle">
            Blocked attempts, auto-suspensions, and suspicious activity flags
          </p>
        </div>
        {isSuperAdmin && (
          <div className="fraud_events_header_actions">
            <button
              type="button"
              className="fraud_run_scan_btn"
              onClick={openScanModal}
              disabled={scanBusy}
            >
              {scanBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FaSync className="h-4 w-4" />
              )}
              Run fraud scan
            </button>
          </div>
        )}
      </header>

      {userIdFilter && (
        <p className="fraud_events_filter_note">
          Showing events for user <code>{userIdFilter}</code>.
        </p>
      )}

      <section className="stats_section">
        {isLoading && !stats
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="stats_card border-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <div>
                  <h2>—</h2>
                  <p>Loading…</p>
                </div>
              </div>
            ))
          : (
            <>
              <div className="stats_card border-red-200">
                <FaExclamationTriangle className="text-red-500 text-2xl" />
                <div>
                  <h2>{stats?.criticalOpen ?? 0}</h2>
                  <p>Critical open</p>
                </div>
              </div>
              <div className="stats_card border-orange-200">
                <FaShieldAlt className="text-orange-500 text-2xl" />
                <div>
                  <h2>{stats?.openCount ?? 0}</h2>
                  <p>Open events</p>
                </div>
              </div>
              <div className="stats_card border-blue-200">
                <FaShieldAlt className="text-blue-500 text-2xl" />
                <div>
                  <h2>{stats?.last24h ?? 0}</h2>
                  <p>Last 24 hours</p>
                </div>
              </div>
              <div className="stats_card border-purple-200">
                <FaUserSlash className="text-purple-500 text-2xl" />
                <div>
                  <h2>{stats?.autoSuspended24h ?? 0}</h2>
                  <p>Auto-suspended (24h)</p>
                </div>
              </div>
            </>
          )}
      </section>

      <div className="fraud_events_filters">
        {canReview ? (
          <AdminBulkSelectToolbar
            selectionMode={selectionMode}
            selectedCount={selectedCount}
            isBusy={bulkBusy || reviewBusy}
            actions={bulkActions}
            allVisibleSelected={allVisibleSelected}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelectionMode={toggleSelectionMode}
            filters={filterControls}
          />
        ) : (
          filterControls
        )}
      </div>

      {error && (
        <div className="admin_alert admin_alert_warning">
          <p>{error}</p>
          <button type="button" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      )}

      <div className="fraud_events_layout">
        <section className="fraud_events_list_panel admin_panel_card">
          {isLoading && events.length === 0 ? (
            <div className="fraud_events_loading">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : events.length === 0 ? (
            <p className="empty_fallback">No fraud events match your filters.</p>
          ) : (
            <div className="fraud_events_list">
              {events.map((event) => {
                const isActive = !selectionMode && selectedEventId === event.id;
                const canSelectRow = selectionMode && event.reviewStatus === 'open';

                return (
                  <div
                    key={event.id}
                    className={`fraud_event_row${isActive ? ' fraud_event_row_active' : ''}${
                      canSelectRow ? ' fraud_event_row_with_checkbox' : ''
                    }${selectionMode && isSelected(event.id) ? ' fraud_event_row_selected' : ''}`}
                  >
                    {canSelectRow && (
                      <AdminRowCheckbox
                        checked={isSelected(event.id)}
                        label={`Select fraud event ${event.eventType}`}
                        onChange={() => toggleItem(event.id)}
                      />
                    )}
                    <button
                      type="button"
                      className="fraud_event_row_button"
                      onClick={() => handleEventRowClick(event)}
                    >
                      <div className="fraud_event_row_main">
                        <div className="fraud_event_row_title">
                          <span className={severityPillClass(event.severity)}>{event.severity}</span>
                          <strong>{event.eventType}</strong>
                          {event.isInternalTestAccount && (
                            <span className="pill pill_internal_test">Internal test</span>
                          )}
                        </div>
                        <p className="fraud_event_row_message">{event.message}</p>
                        <p className="fraud_event_row_meta">
                          {event.userName || event.userEmail || event.userId || 'Unknown user'}
                          {event.serviceLabel ? ` · ${event.serviceLabel}` : ''}
                          {event.amount != null ? ` · ${formatPrice(event.amount)}` : ''}
                        </p>
                      </div>
                      <div className="fraud_event_row_side">
                        <span className={`pill pill_review_${event.reviewStatus}`}>
                          {event.reviewStatus}
                        </span>
                        <div className="fraud_event_row_times">
                          {event.transactionCreatedAt && (
                            <span className="fraud_event_row_txn_time" title="Transaction date">
                              Txn {formatLastActive(event.transactionCreatedAt)}
                            </span>
                          )}
                          <span className="fraud_event_row_detected_time" title="Detected">
                            Detected {formatLastActive(event.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="fraud_events_pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
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
          )}
        </section>

        <aside className="fraud_event_detail_panel admin_panel_card">
          {!selectedEvent ? (
            <p className="empty_fallback">Select an event to view details.</p>
          ) : (
            <>
              <div className="fraud_event_detail_header">
                <h2>{selectedEvent.eventType}</h2>
                <span className={severityPillClass(selectedEvent.severity)}>
                  {selectedEvent.severity}
                </span>
              </div>

              <p className="fraud_event_detail_message">{selectedEvent.message}</p>

              <div className="fraud_event_detail_grid">
                <div>
                  <span className="fraud_detail_label">Action taken</span>
                  <span>{actionLabel(selectedEvent.actionTaken)}</span>
                </div>
                <div>
                  <span className="fraud_detail_label">Code</span>
                  <span>{selectedEvent.code}</span>
                </div>
                <div>
                  <span className="fraud_detail_label">Review status</span>
                  <span className={`pill pill_review_${selectedEvent.reviewStatus}`}>
                    {selectedEvent.reviewStatus}
                  </span>
                </div>
                {selectedEvent.amount != null && (
                  <div>
                    <span className="fraud_detail_label">Amount</span>
                    <span>{formatPrice(selectedEvent.amount)}</span>
                  </div>
                )}
                {selectedEvent.serviceLabel && (
                  <div>
                    <span className="fraud_detail_label">Service</span>
                    <span>{selectedEvent.serviceLabel}</span>
                  </div>
                )}
                {selectedEvent.transactionId && (
                  <div>
                    <span className="fraud_detail_label">Transaction</span>
                    <Link
                      href={withAdminReturn(
                        `/command-center/transactions/${selectedEvent.transactionId}`,
                        fraudEventsReturn
                      )}
                    >
                      {selectedEvent.transactionReference || selectedEvent.transactionId}
                    </Link>
                  </div>
                )}
                {selectedEvent.transactionCreatedAt && (
                  <div>
                    <span className="fraud_detail_label">Transaction date</span>
                    <span>{formatAdminDateTime(selectedEvent.transactionCreatedAt)}</span>
                  </div>
                )}
                {selectedEvent.userId && (
                  <div>
                    <span className="fraud_detail_label">User</span>
                    <Link
                      href={withAdminReturn(
                        `/command-center/users/${selectedEvent.userId}`,
                        fraudEventsReturn
                      )}
                    >
                      {selectedEvent.userName || selectedEvent.userEmail || selectedEvent.userId}
                    </Link>
                  </div>
                )}
                {selectedEvent.ipAddress && (
                  <div>
                    <span className="fraud_detail_label">IP</span>
                    <span>{selectedEvent.ipAddress}</span>
                  </div>
                )}
                {selectedEvent.userAgent && (
                  <div className="fraud_detail_full">
                    <span className="fraud_detail_label">User-Agent</span>
                    <span>{selectedEvent.userAgent}</span>
                  </div>
                )}
                {selectedEvent.requestPath && (
                  <div>
                    <span className="fraud_detail_label">Request path</span>
                    <span>{selectedEvent.requestPath}</span>
                  </div>
                )}
                <div>
                  <span className="fraud_detail_label">Detected</span>
                  <span>{formatAdminDateTime(selectedEvent.createdAt)}</span>
                </div>
              </div>

              {selectedEvent.isInternalTestAccount && (
                <div className="admin_alert admin_alert_warning">
                  Internal test account — flagged for review only. No auto-suspend or block was
                  applied.
                </div>
              )}

              {canReview && selectedEvent.reviewStatus === 'open' && (
                <div className="fraud_event_review_form">
                  <label htmlFor="fraud-review-notes">Review notes (optional)</label>
                  <textarea
                    id="fraud-review-notes"
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Investigation notes…"
                  />
                  {reviewError && <p className="fraud_review_error">{reviewError}</p>}
                  <div className="fraud_event_review_actions">
                    <button
                      type="button"
                      className="btn_primary"
                      disabled={reviewBusy}
                      onClick={() => handleReview('reviewed')}
                    >
                      Mark reviewed
                    </button>
                    <button
                      type="button"
                      className="btn_secondary"
                      disabled={reviewBusy}
                      onClick={() => handleReview('dismissed')}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {selectedEvent.reviewNotes && (
                <div className="fraud_event_review_notes">
                  <span className="fraud_detail_label">Review notes</span>
                  <p>{selectedEvent.reviewNotes}</p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      <RunFraudScanModal
        open={showScanModal}
        isScanning={scanBusy}
        steps={scanSteps}
        result={scanResult}
        error={scanError}
        onClose={closeScanModal}
        onConfirm={handleRunScan}
      />
    </div>
  );
}

export default function FraudEventsPage() {
  return (
    <ProtectedRoute>
      <FraudEventsContent />
    </ProtectedRoute>
  );
}

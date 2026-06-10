'use client';

import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { AdminLog } from '@/types/adminManagement';

type AdminActivityDetailModalProps = {
  open: boolean;
  log: AdminLog | null;
  onClose: () => void;
};

function formatMetadataValue(value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function metadataEntries(log: AdminLog): { label: string; value: string }[] {
  const meta = log.metadata ?? {};
  const entries: { label: string; value: string }[] = [];

  const push = (label: string, key: string) => {
    const value = meta[key];
    if (value == null || value === '') return;
    entries.push({ label, value: formatMetadataValue(value) });
  };

  push('Reason', 'reason');
  push('Target user', 'target_user_name');
  push('Target user ID', 'target_user_id');
  push('Target email', 'target_email');
  push('Transaction reference', 'transaction_reference');
  push('Review status', 'review_status');
  push('Fraud flags', 'fraud_flags');
  push('Message', 'message');
  push('Updated fields', 'updated_fields');
  push('Previous role', 'previous_role');
  push('New role', 'new_role');
  push('Previous status', 'previous_status');
  push('New status', 'new_status');
  push('Notes', 'notes');

  const known = new Set([
    'reason',
    'target_user_name',
    'target_user_id',
    'target_email',
    'transaction_reference',
    'review_status',
    'fraud_flags',
    'message',
    'updated_fields',
    'previous_role',
    'new_role',
    'previous_status',
    'new_status',
    'notes',
  ]);

  for (const [key, value] of Object.entries(meta)) {
    if (known.has(key)) continue;
    if (value == null || value === '') continue;
    entries.push({
      label: key.replace(/_/g, ' '),
      value: formatMetadataValue(value),
    });
  }

  return entries;
}

export function AdminActivityDetailModal({
  open,
  log,
  onClose,
}: AdminActivityDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !log) return null;

  const details = metadataEntries(log);

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="activity-detail-title">Activity details</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <div className="admin_modal_body">
          <dl className="activity_detail_grid">
            <div className="activity_detail_item">
              <dt>Action</dt>
              <dd>{log.action}</dd>
            </div>
            <div className="activity_detail_item">
              <dt>Summary</dt>
              <dd>{log.detail}</dd>
            </div>
            <div className="activity_detail_item">
              <dt>Status</dt>
              <dd style={{ textTransform: 'capitalize' }}>{log.status ?? 'success'}</dd>
            </div>
            <div className="activity_detail_item">
              <dt>Time</dt>
              <dd>{log.timestamp}</dd>
            </div>
            <div className="activity_detail_item">
              <dt>IP address</dt>
              <dd>{log.ip}</dd>
            </div>
            {log.entity_type && (
              <div className="activity_detail_item">
                <dt>Entity type</dt>
                <dd>{log.entity_type}</dd>
              </div>
            )}
            {log.entity_id && (
              <div className="activity_detail_item">
                <dt>Entity ID</dt>
                <dd>{log.entity_id}</dd>
              </div>
            )}
          </dl>

          {details.length > 0 ? (
            <section className="activity_detail_metadata">
              <h3>Additional details</h3>
              <dl className="activity_detail_grid">
                {details.map((entry) => (
                  <div key={entry.label} className="activity_detail_item">
                    <dt>{entry.label}</dt>
                    <dd className={entry.value.includes('\n') ? 'activity_detail_pre' : undefined}>
                      {entry.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : (
            <p className="admin_form_hint">No extra metadata recorded for this activity.</p>
          )}
        </div>
        <div className="admin_modal_footer">
          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

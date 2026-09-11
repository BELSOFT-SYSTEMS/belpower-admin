'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export type BusinessQuickActionType = 'block' | 'unblock' | 'deactivate';

type BusinessQuickActionModalProps = {
  open: boolean;
  action: BusinessQuickActionType | null;
  businessName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason?: string }) => void;
};

const ACTION_COPY: Record<
  BusinessQuickActionType,
  {
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    noteLabel?: string;
    notePlaceholder?: string;
  }
> = {
  block: {
    title: 'Block business',
    message: 'This business will lose portal access until unblocked.',
    confirmLabel: 'Block business',
    danger: true,
    noteLabel: 'Reason (optional)',
    notePlaceholder: 'Add a note for the audit log',
  },
  unblock: {
    title: 'Unblock business',
    message: 'This will restore portal access for the business.',
    confirmLabel: 'Unblock business',
    danger: false,
  },
  deactivate: {
    title: 'Deactivate business',
    message: 'The business account will be deactivated and sessions revoked.',
    confirmLabel: 'Deactivate business',
    danger: true,
    noteLabel: 'Reason (optional)',
    notePlaceholder: 'Add a note for the audit log',
  },
};

export function BusinessQuickActionModal({
  open,
  action,
  businessName,
  isSubmitting,
  onClose,
  onConfirm,
}: BusinessQuickActionModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open, action]);

  if (!open || !action) return null;

  const copy = ACTION_COPY[action];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      reason: reason.trim() || undefined,
    });
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className={`admin_modal admin_modal_sm${copy.danger ? ' admin_modal_danger' : ''}`}
        role="dialog"
        aria-labelledby="business-action-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="business-action-title">{copy.title}</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form className="admin_modal_form" onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_confirm_message">
              {copy.message}
              <br />
              <strong>{businessName}</strong>
            </p>

            {copy.noteLabel ? (
              <div className="admin_form_row">
                <label htmlFor="business-action-reason">{copy.noteLabel}</label>
                <textarea
                  id="business-action-reason"
                  className="user_action_textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder={copy.notePlaceholder}
                />
              </div>
            ) : null}
          </div>

          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={copy.danger ? 'btn_danger' : 'btn_primary'}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="inline-spinner" style={{ width: 14, height: 14 }} />
                  Processing…
                </>
              ) : (
                copy.confirmLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

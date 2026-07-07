'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export type PartnerQuickActionType =
  | 'approve'
  | 'reject'
  | 'reopenReview'
  | 'block'
  | 'unblock'
  | 'deactivate'
  | 'refundsUnblock';

type PartnerQuickActionModalProps = {
  open: boolean;
  action: PartnerQuickActionType | null;
  partnerName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { note?: string; reason?: string }) => void;
};

const ACTION_COPY: Record<
  PartnerQuickActionType,
  {
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    noteLabel?: string;
    reasonRequired?: boolean;
    notePlaceholder?: string;
  }
> = {
  approve: {
    title: 'Approve partner',
    message: 'This partner will receive API keys and dashboard access.',
    confirmLabel: 'Approve partner',
    danger: false,
    noteLabel: 'Internal note (optional)',
    notePlaceholder: 'Add an internal note for the audit log',
  },
  reject: {
    title: 'Reject application',
    message:
      'The partner will be notified by email and can sign in to view this reason on their status page.',
    confirmLabel: 'Reject partner',
    danger: true,
    noteLabel: 'Rejection reason',
    reasonRequired: true,
    notePlaceholder:
      'Explain why the application was rejected. This is sent to the partner by email.',
  },
  reopenReview: {
    title: 'Reopen for review',
    message:
      'This moves the application back to pending review after support follow-up. The partner will be notified and cannot submit a new application.',
    confirmLabel: 'Reopen for review',
    danger: false,
    noteLabel: 'Internal note (optional)',
    notePlaceholder: 'Summarize what support received or why the case is being reopened',
  },
  block: {
    title: 'Block partner',
    message: 'This partner will lose dashboard and API access until unblocked.',
    confirmLabel: 'Block partner',
    danger: true,
    noteLabel: 'Reason (optional)',
    notePlaceholder: 'Add a note for the audit log',
  },
  unblock: {
    title: 'Unblock partner',
    message: 'This will restore dashboard and API access for the partner.',
    confirmLabel: 'Unblock partner',
    danger: false,
  },
  deactivate: {
    title: 'Deactivate partner',
    message: 'API keys will be disabled and the partner account will be deactivated.',
    confirmLabel: 'Deactivate partner',
    danger: true,
    noteLabel: 'Reason (optional)',
    notePlaceholder: 'Add a note for the audit log',
  },
  refundsUnblock: {
    title: 'Clear partner flag',
    message:
      'This clears the audit hold on the partner account. Use this when review is complete and no refund action is needed.',
    confirmLabel: 'Clear flag',
    danger: false,
    noteLabel: 'Review note (optional)',
    notePlaceholder: 'Add a note for the audit log',
  },
};

export function PartnerQuickActionModal({
  open,
  action,
  partnerName,
  isSubmitting,
  onClose,
  onConfirm,
}: PartnerQuickActionModalProps) {
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setNote('');
      setReason('');
    }
  }, [open, action]);

  if (!open || !action) return null;

  const copy = ACTION_COPY[action];
  const textValue = action === 'reject' ? reason : note;
  const fieldId = 'partner-action-note';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      note: note.trim() || undefined,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className={`admin_modal admin_modal_sm${copy.danger ? ' admin_modal_danger' : ''}`}
        role="dialog"
        aria-labelledby="partner-action-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="partner-action-title">{copy.title}</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form className="admin_modal_form" onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_confirm_message">
              {copy.message}
              <br />
              <strong>{partnerName}</strong>
            </p>

            {copy.noteLabel ? (
              <div className="admin_form_row">
                <label htmlFor={fieldId}>
                  {copy.noteLabel}
                  {copy.reasonRequired ? ' (required)' : ''}
                </label>
                <textarea
                  id={fieldId}
                  className="user_action_textarea"
                  value={textValue}
                  onChange={(e) =>
                    action === 'reject' ? setReason(e.target.value) : setNote(e.target.value)
                  }
                  rows={4}
                  required={copy.reasonRequired}
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
              disabled={isSubmitting || (copy.reasonRequired && !reason.trim())}
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

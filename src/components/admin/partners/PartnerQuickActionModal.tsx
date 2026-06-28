'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export type PartnerQuickActionType =
  | 'approve'
  | 'reject'
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
  }
> = {
  approve: {
    title: 'Approve partner',
    message: 'This partner will receive API keys and dashboard access.',
    confirmLabel: 'Approve partner',
    danger: false,
    noteLabel: 'Internal note (optional)',
  },
  reject: {
    title: 'Reject application',
    message: 'The partner will be notified that their application was rejected.',
    confirmLabel: 'Reject partner',
    danger: true,
    noteLabel: 'Rejection reason',
    reasonRequired: true,
  },
  block: {
    title: 'Block partner',
    message: 'This partner will lose dashboard and API access until unblocked.',
    confirmLabel: 'Block partner',
    danger: true,
    noteLabel: 'Reason (optional)',
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
  },
  refundsUnblock: {
    title: 'Unblock wallet refunds',
    message:
      'Failed partner purchases can be refunded again after this hold is cleared. Ops will be notified.',
    confirmLabel: 'Unblock refunds',
    danger: false,
    noteLabel: 'Review note (optional)',
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

        <form onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_modal_message">{copy.message}</p>
            <p className="admin_modal_target">
              <strong>{partnerName}</strong>
            </p>

            {copy.noteLabel ? (
              <label className="admin_modal_field">
                <span>{copy.noteLabel}</span>
                <textarea
                  value={textValue}
                  onChange={(e) =>
                    action === 'reject' ? setReason(e.target.value) : setNote(e.target.value)
                  }
                  rows={3}
                  required={copy.reasonRequired}
                />
              </label>
            ) : null}
          </div>

          <div className="admin_modal_footer">
            <button type="button" className="admin_modal_cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={copy.danger ? 'admin_modal_confirm_danger' : 'admin_modal_confirm'}
              disabled={isSubmitting || (copy.reasonRequired && !reason.trim())}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} aria-hidden />
                  Working…
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

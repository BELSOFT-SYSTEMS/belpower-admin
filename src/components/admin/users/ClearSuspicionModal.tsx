'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminUsers.css';

type ClearSuspicionModalProps = {
  open: boolean;
  userName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
};

export function ClearSuspicionModal({
  open,
  userName,
  isSubmitting,
  onClose,
  onConfirm,
}: ClearSuspicionModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_sm"
        role="dialog"
        aria-labelledby="clear-suspicion-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="clear-suspicion-title">Clear suspicion flag</h2>
          <button
            type="button"
            className="admin_modal_close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <form className="admin_modal_form" onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_confirm_message">
              This will clear the suspicious activity flag on <strong>{userName}</strong>, dismiss
              open fraud events, and clear flagged transactions for this user.
            </p>

            <div className="admin_form_row">
              <label htmlFor="clear-suspicion-reason">Reason (optional)</label>
              <textarea
                id="clear-suspicion-reason"
                className="user_action_textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this flag being cleared?"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn_primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="inline-spinner" style={{ width: 14, height: 14 }} /> Clearing…
                </>
              ) : (
                'Clear flag'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

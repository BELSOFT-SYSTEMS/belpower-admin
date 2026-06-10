'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminAdmins.css';

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
        className="admin_modal"
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

        <form onSubmit={handleSubmit}>
          <p className="admin_modal_message">
            This will clear the suspicious activity flag on <strong>{userName}</strong>.
            Individual transactions may still show as flagged.
          </p>

          <label className="admin_modal_field">
            <span>Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this flag being cleared?"
              rows={3}
              disabled={isSubmitting}
            />
          </label>

          <div className="admin_modal_actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="admin_modal_confirm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Clearing…
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

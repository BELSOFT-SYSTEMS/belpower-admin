'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export type UserQuickActionType = 'block' | 'suspend' | 'activate';

type UserQuickActionModalProps = {
  open: boolean;
  action: UserQuickActionType | null;
  userName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason?: string; days?: number }) => void;
};

const ACTION_COPY: Record<
  UserQuickActionType,
  { title: string; message: string; confirmLabel: string; danger: boolean }
> = {
  block: {
    title: 'Block user',
    message: 'This user will be blocked from using BelPower. You can activate them later.',
    confirmLabel: 'Block user',
    danger: true,
  },
  suspend: {
    title: 'Suspend user',
    message: 'This user will be temporarily suspended. Optionally set how long.',
    confirmLabel: 'Suspend user',
    danger: true,
  },
  activate: {
    title: 'Activate user',
    message: 'This will restore the user’s access to BelPower.',
    confirmLabel: 'Activate user',
    danger: false,
  },
};

export function UserQuickActionModal({
  open,
  action,
  userName,
  isSubmitting,
  onClose,
  onConfirm,
}: UserQuickActionModalProps) {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setDays('');
    }
  }, [open, action]);

  if (!open || !action) return null;

  const copy = ACTION_COPY[action];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      reason: reason.trim() || undefined,
      days: days ? Number(days) : undefined,
    });
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className={`admin_modal admin_modal_sm${copy.danger ? ' admin_modal_danger' : ''}`}
        role="dialog"
        aria-labelledby="user-action-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="user-action-title">{copy.title}</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form className="admin_modal_form" onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_confirm_message">
              {copy.message}
              <br />
              <strong>{userName}</strong>
            </p>

            {(action === 'block' || action === 'suspend') && (
              <div className="admin_form_row">
                <label htmlFor="user-action-reason">Reason (optional)</label>
                <textarea
                  id="user-action-reason"
                  className="user_action_textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add a note for the audit log"
                />
              </div>
            )}

            {action === 'suspend' && (
              <div className="admin_form_row">
                <label htmlFor="user-action-days">Suspend for (days, optional)</label>
                <input
                  id="user-action-days"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="e.g. 7"
                />
              </div>
            )}
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

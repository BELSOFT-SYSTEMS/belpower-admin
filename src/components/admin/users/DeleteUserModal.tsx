'use client';

import { FormEvent } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminAdmins.css';

type DeleteUserModalProps = {
  open: boolean;
  userName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteUserModal({
  open,
  userName,
  isSubmitting,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_sm"
        role="dialog"
        aria-labelledby="delete-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="delete-user-title">Delete user</h2>
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
          <p className="admin_confirm_message" style={{ padding: '0 0 1rem' }}>
            This permanently deletes <strong>{userName}</strong> and cannot be undone.
          </p>

          <div className="admin_modal_actions">
            <button
              type="button"
              className="btn_secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn_danger" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="inline-spinner" style={{ width: 14, height: 14 }} />
                  Deleting…
                </>
              ) : (
                'Delete user'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

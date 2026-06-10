'use client';

import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function AdminConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onClose,
  onConfirm,
}: AdminConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className={`admin_modal admin_modal_sm${danger ? ' admin_modal_danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="confirm-title">{title}</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <div className="admin_modal_body">
          <p className="admin_confirm_message">{message}</p>
        </div>
        <div className="admin_modal_footer">
          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={danger ? 'btn_danger' : 'btn_primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

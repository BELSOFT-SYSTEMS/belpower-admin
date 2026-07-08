'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/FormatPrice';
import '@/styles/adminShared.css';

type Props = {
  open: boolean;
  partnerName: string;
  amount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function PartnerDepositRejectModal({
  open,
  partnerName,
  amount,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_sm admin_modal_danger"
        role="dialog"
        aria-labelledby="partner-deposit-reject-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="partner-deposit-reject-title">Reject deposit request</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form className="admin_modal_form" onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_confirm_message">
              Reject the {formatPrice(amount)} deposit request from <strong>{partnerName}</strong>?
              The partner will be notified and can update the request to fix the issue.
            </p>

            <div className="admin_form_row">
              <label htmlFor="partner-deposit-reject-reason">Rejection reason (required)</label>
              <textarea
                id="partner-deposit-reject-reason"
                className="user_action_textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                placeholder="Example: Proof of payment is unclear. Please upload a clearer screenshot showing the transfer amount and reference."
              />
            </div>
          </div>

          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn_danger"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="inline-spinner" style={{ width: 14, height: 14 }} />
                  Rejecting…
                </>
              ) : (
                'Reject deposit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

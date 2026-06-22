'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/FormatPrice';

type TransactionRefundModalProps = {
  open: boolean;
  userName: string;
  refundAmount: number;
  transactionReference: string;
  eligibilityHint?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
};

export function TransactionRefundModal({
  open,
  userName,
  refundAmount,
  transactionReference,
  eligibilityHint,
  isSubmitting,
  onClose,
  onConfirm,
}: TransactionRefundModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_sm admin_modal_wallet"
        role="dialog"
        aria-labelledby="txn-refund-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="txn-refund-title">Refund to wallet</h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form className="admin_modal_form" onSubmit={handleSubmit}>
          <div className="admin_modal_body">
            <p className="admin_confirm_message">
              Refund <strong>{formatPrice(refundAmount)}</strong> to{' '}
              <strong>{userName}</strong>&apos;s wallet?
              <br />
              <br />
              This credits the customer wallet for a failed or pending transaction where payment
              was taken.
            </p>

            <p className="admin_form_hint">
              Transaction: <strong>{transactionReference}</strong>
            </p>

            {eligibilityHint ? <p className="admin_form_hint">{eligibilityHint}</p> : null}

            <div className="admin_form_row">
              <label htmlFor="txn-refund-reason">Reason (optional)</label>
              <textarea
                id="txn-refund-reason"
                className="user_action_textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note for the audit log"
              />
            </div>
          </div>

          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn_wallet_refund" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="inline-spinner" style={{ width: 14, height: 14 }} />
                  Processing…
                </>
              ) : (
                'Refund to wallet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

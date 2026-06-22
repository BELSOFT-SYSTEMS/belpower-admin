'use client';

import { useEffect, useState } from 'react';
import { Check, Clock, Loader2, X } from 'lucide-react';
import type { AdminPurchaseService } from '@/lib/adminUserPurchases';
import { formatPrice } from '@/utils/FormatPrice';

export type AdminPurchaseStatus = 'processing' | 'success' | 'pending' | 'error';

const SERVICE_LABELS: Record<AdminPurchaseService, string> = {
  airtime: 'Airtime',
  data: 'Data bundle',
  electricity: 'Electricity',
  cable: 'Cable TV',
};

const PROCESSING_COPY: Partial<Record<AdminPurchaseService, string>> = {
  electricity:
    "We're processing this transaction. Please wait while we generate the token.",
  cable: 'Please wait while we complete this cable subscription purchase.',
  data: 'Please wait while we complete this data bundle purchase.',
  airtime: 'Please wait while we complete this airtime purchase.',
};

type Props = {
  open: boolean;
  status: AdminPurchaseStatus;
  service?: AdminPurchaseService;
  message?: string;
  reference?: string;
  amount?: number;
  countdown?: number;
  onComplete?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export function AdminPurchaseStatusOverlay({
  open,
  status,
  service,
  message,
  reference,
  amount,
  countdown = 5,
  onComplete,
  onRetry,
  onDismiss,
}: Props) {
  const [remainingTime, setRemainingTime] = useState(countdown);

  useEffect(() => {
    if (!open) return;
    setRemainingTime(countdown);
  }, [open, status, countdown]);

  useEffect(() => {
    if (!open || (status !== 'success' && status !== 'pending')) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, status, countdown]);

  useEffect(() => {
    if (!open || (status !== 'success' && status !== 'pending')) return;
    if (remainingTime !== 0) return;

    const timer = setTimeout(() => {
      onComplete?.();
    }, 0);

    return () => clearTimeout(timer);
  }, [open, status, remainingTime, onComplete]);

  if (!open) return null;

  const serviceLabel = service ? SERVICE_LABELS[service] : 'Purchase';
  const processingMessage =
    (service && PROCESSING_COPY[service]) ||
    'Please wait while we complete this purchase for the user.';

  return (
    <div
      className="admin_purchase_processing_overlay"
      role="status"
      aria-live="polite"
      aria-busy={status === 'processing'}
      aria-label={`Purchase ${status}`}
    >
      <div className={`admin_purchase_processing_card admin_purchase_status_${status}`}>
        {status === 'processing' && (
          <>
            <div className="admin_purchase_processing_spinner" aria-hidden="true">
              <Loader2 size={48} />
            </div>
            <h2>Processing…</h2>
            <p>{processingMessage}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="admin_purchase_status_icon admin_purchase_status_icon_success" aria-hidden="true">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h2>{serviceLabel} purchase successful</h2>
            {amount != null && amount > 0 && (
              <p className="admin_purchase_status_amount">{formatPrice(amount)} completed for user</p>
            )}
            {message && <p>{message}</p>}
            {reference && (
              <p className="admin_purchase_status_meta">
                Reference: <strong>{reference}</strong>
              </p>
            )}
            <p className="admin_purchase_status_countdown">
              Returning in {remainingTime} second{remainingTime === 1 ? '' : 's'}…
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="admin_purchase_status_icon admin_purchase_status_icon_pending" aria-hidden="true">
              <Clock size={28} strokeWidth={2.5} />
            </div>
            <h2>Purchase is processing</h2>
            <p>
              {message ||
                'Wallet debited. Final status may take a moment — check Transactions for updates.'}
            </p>
            {reference && (
              <p className="admin_purchase_status_meta">
                Reference: <strong>{reference}</strong>
              </p>
            )}
            <p className="admin_purchase_status_countdown">
              Returning in {remainingTime} second{remainingTime === 1 ? '' : 's'}…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="admin_purchase_status_icon admin_purchase_status_icon_error" aria-hidden="true">
              <X size={28} strokeWidth={2.5} />
            </div>
            <h2>Purchase failed</h2>
            <p>{message || 'Something went wrong. Please try again.'}</p>
            <div className="admin_purchase_status_actions">
              {onRetry && (
                <button type="button" className="btn_primary" onClick={onRetry}>
                  Try again
                </button>
              )}
              {onDismiss && (
                <button type="button" className="btn_secondary" onClick={onDismiss}>
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

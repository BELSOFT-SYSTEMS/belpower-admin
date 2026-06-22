'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type {
  AdminPurchaseResult,
  AdminPurchaseService,
  PurchasePreflight,
} from '@/lib/adminUserPurchases';
import { formatPrice } from '@/utils/FormatPrice';
import { AdminPurchaseConfirmStep } from '@/components/admin/users/billPurchase/AdminPurchaseConfirmStep';
import { AdminPurchaseFormStep } from '@/components/admin/users/billPurchase/AdminPurchaseFormStep';
import {
  AdminPurchaseStatusOverlay,
  type AdminPurchaseStatus,
} from '@/components/admin/users/billPurchase/AdminPurchaseStatusOverlay';
import {
  buildPurchasePayload,
  getTotalDebit,
  type PurchaseDraft,
} from '@/components/admin/users/billPurchase/purchaseModalUtils';
import '@/styles/adminUserPurchases.css';

type Props = {
  service: AdminPurchaseService;
  userEmail?: string | null;
  userPhone?: string | null;
  userName?: string | null;
  preflight: PurchasePreflight;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<AdminPurchaseResult>;
  onComplete?: () => void | Promise<void>;
};

type ModalStep = 'form' | 'confirm';

type StatusOverlayState = {
  status: AdminPurchaseStatus;
  message?: string;
  reference?: string;
  amount?: number;
};

export function AdminUserPurchaseModal({
  service,
  userEmail,
  userPhone,
  userName,
  preflight,
  onClose,
  onSubmit,
  onComplete,
}: Props) {
  const [step, setStep] = useState<ModalStep>('form');
  const [draft, setDraft] = useState<PurchaseDraft | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayState | null>(null);

  const isBusy = statusOverlay !== null;
  const isProcessing = statusOverlay?.status === 'processing';

  const handleConfirm = async () => {
    if (!draft || isBusy) return;

    const totalDebit = getTotalDebit(draft);
    if (totalDebit > preflight.walletBalance) {
      toast.error('Insufficient wallet balance for this purchase');
      return;
    }
    if (totalDebit > preflight.maxSingleTransaction) {
      toast.error(
        `Purchase exceeds max single transaction of ${formatPrice(preflight.maxSingleTransaction)}`
      );
      return;
    }

    setSubmitError(null);
    setStatusOverlay({ status: 'processing' });

    try {
      const result = await onSubmit(
        buildPurchasePayload(draft, userEmail, { phone: userPhone, name: userName })
      );
      const isPending =
        result.pending === true ||
        result.status === 'pending' ||
        result.status === 'processing';

      setStatusOverlay({
        status: isPending ? 'pending' : 'success',
        message: result.message,
        reference: result.reference,
        amount: result.amount ?? totalDebit,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      setSubmitError(message);
      setStatusOverlay({
        status: 'error',
        message,
      });
    }
  };

  const handleStatusComplete = () => {
    setStatusOverlay(null);
    void onComplete?.();
    onClose();
  };

  const handleStatusRetry = () => {
    setStatusOverlay(null);
  };

  const handleStatusDismiss = () => {
    setStatusOverlay(null);
    onClose();
  };

  const handleClose = () => {
    if (isBusy && statusOverlay?.status !== 'error') return;
    onClose();
  };

  return (
    <>
      <AdminPurchaseStatusOverlay
        open={statusOverlay !== null}
        status={statusOverlay?.status ?? 'processing'}
        service={service}
        message={statusOverlay?.message}
        reference={statusOverlay?.reference}
        amount={statusOverlay?.amount}
        onComplete={handleStatusComplete}
        onRetry={statusOverlay?.status === 'error' ? handleStatusRetry : undefined}
        onDismiss={statusOverlay?.status === 'error' ? handleStatusDismiss : undefined}
      />
      <div
        className="admin_purchase_modal_backdrop"
        role="presentation"
        onClick={handleClose}
      >
        <div
          className="admin_purchase_modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Purchase ${service}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="admin_purchase_modal_scroll">
            {step === 'form' || !draft ? (
              <AdminPurchaseFormStep
                service={service}
                onContinue={(nextDraft) => {
                  setDraft(nextDraft);
                  setStep('confirm');
                }}
                onClose={handleClose}
              />
            ) : (
              <AdminPurchaseConfirmStep
                draft={draft}
                preflight={preflight}
                userEmail={userEmail}
                isSubmitting={isProcessing}
                submitError={submitError}
                onBack={() => {
                  if (isBusy) return;
                  setSubmitError(null);
                  setStep('form');
                }}
                onConfirm={() => void handleConfirm()}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

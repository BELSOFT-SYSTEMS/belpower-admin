'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import {
  creditUserWalletManual,
  fetchWalletCreditPreflight,
  type WalletCreditPreflight,
} from '@/lib/adminUserWalletCredit';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import {
  AdminPurchaseStatusOverlay,
  type AdminPurchaseStatus,
} from '@/components/admin/users/billPurchase/AdminPurchaseStatusOverlay';
import '@/styles/adminUserPurchases.css';

type Props = {
  userId: string;
  onCreditComplete?: () => void;
};

type StatusOverlayState = {
  status: AdminPurchaseStatus;
  message?: string;
  reference?: string;
  amount?: number;
};

export function ManualWalletCreditPanel({ userId, onCreditComplete }: Props) {
  const [preflight, setPreflight] = useState<WalletCreditPreflight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [bankReceivedAt, setBankReceivedAt] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayState | null>(null);

  const isBusy = statusOverlay !== null;
  const isProcessing = statusOverlay?.status === 'processing';

  const loadPreflight = async () => {
    setIsLoading(true);
    try {
      if (getAdminDemoMode()) {
        setPreflight({
          walletBalance: 0,
          userStatus: 'active',
          canCredit: true,
          blockReasons: [],
          maxWalletBalance: 500101,
          maxCreditAllowed: 500101,
        });
      } else {
        setPreflight(await fetchWalletCreditPreflight(userId));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load wallet credit details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPreflight();
  }, [userId]);

  const resetForm = () => {
    setAmount('');
    setBankReference('');
    setBankReceivedAt('');
    setAdminNote('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid credit amount');
      return;
    }
    if (!bankReference.trim()) {
      toast.error('Bank reference is required');
      return;
    }
    if (!adminNote.trim()) {
      toast.error('Admin note is required');
      return;
    }

    setStatusOverlay({ status: 'processing' });

    try {
      if (getAdminDemoMode()) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        setStatusOverlay({
          status: 'success',
          amount: parsedAmount,
          reference: 'DEMO-WALLET-CREDIT',
          message: 'Demo wallet credit simulated successfully.',
        });
        return;
      }

      const result = await creditUserWalletManual(userId, {
        amount: parsedAmount,
        bankReference: bankReference.trim(),
        bankReceivedAt: bankReceivedAt || undefined,
        adminNote: adminNote.trim(),
        notifyUser,
      });

      setStatusOverlay({
        status: 'success',
        amount: result.amount,
        reference: result.reference,
        message: `New wallet balance: ${formatPrice(result.walletBalance)}`,
      });
    } catch (err) {
      setStatusOverlay({
        status: 'error',
        message: err instanceof Error ? err.message : 'Wallet credit failed',
      });
    }
  };

  const handleStatusComplete = async () => {
    setStatusOverlay(null);
    resetForm();
    await loadPreflight();
    onCreditComplete?.();
  };

  const handleStatusRetry = () => {
    setStatusOverlay(null);
  };

  if (isLoading) {
    return (
      <div className="admin_purchase_loading">
        <Loader2 className="animate-spin" /> Loading wallet credit details…
      </div>
    );
  }

  if (!preflight) return null;

  return (
    <>
      <AdminPurchaseStatusOverlay
        open={statusOverlay !== null}
        status={statusOverlay?.status ?? 'processing'}
        context="wallet_credit"
        message={statusOverlay?.message}
        reference={statusOverlay?.reference}
        amount={statusOverlay?.amount}
        onComplete={() => void handleStatusComplete()}
        onRetry={statusOverlay?.status === 'error' ? handleStatusRetry : undefined}
        onDismiss={statusOverlay?.status === 'error' ? handleStatusRetry : undefined}
      />

      <div className="admin_purchase_tab">
        <div className="admin_purchase_preflight admin_panel_card">
          <div>
            <span className="admin_purchase_eyebrow">Wallet balance</span>
            <strong className="admin_purchase_balance">{formatPrice(preflight.walletBalance)}</strong>
          </div>
          <div className="admin_purchase_preflight_meta">
            <span>Status: {preflight.userStatus}</span>
            <span>
              Max credit allowed now:{' '}
              {preflight.isInternalTestAccount || preflight.maxCreditAllowed == null
                ? 'No limit (internal test account)'
                : formatPrice(preflight.maxCreditAllowed)}
            </span>
          </div>
          {!preflight.canCredit && preflight.blockReasons.length > 0 && (
            <div className="admin_panel_alert admin_panel_alert_warning">
              {preflight.blockReasons.map((reason) => (
                <p key={reason}>{reason}</p>
              ))}
            </div>
          )}
        </div>

        <div className="admin_wallet_credit_panel admin_panel_card">
          <h3 className="admin_purchase_subheading">Manual wallet credit</h3>
          <p className="admin_form_hint admin_wallet_credit_intro">
            Credit the user wallet after verifying a bank transfer. Bank reference and a verification
            note are required for audit.
          </p>

          <form className="admin_wallet_credit_form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="admin_purchase_field_group">
              <label htmlFor="wallet-credit-amount">Amount to credit (₦)</label>
              <input
                id="wallet-credit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!preflight.canCredit || isBusy}
              />
            </div>
            <div className="admin_purchase_field_group">
              <label htmlFor="wallet-credit-bank-ref">Bank reference / transaction ID</label>
              <input
                id="wallet-credit-bank-ref"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                disabled={!preflight.canCredit || isBusy}
              />
            </div>
            <div className="admin_purchase_field_group">
              <label htmlFor="wallet-credit-received-at">Date received (optional)</label>
              <input
                id="wallet-credit-received-at"
                type="date"
                value={bankReceivedAt}
                onChange={(e) => setBankReceivedAt(e.target.value)}
                disabled={!preflight.canCredit || isBusy}
              />
            </div>
            <div className="admin_purchase_field_group">
              <label htmlFor="wallet-credit-note">Verification note</label>
              <textarea
                id="wallet-credit-note"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                disabled={!preflight.canCredit || isBusy}
                placeholder="How was this bank transfer verified?"
              />
            </div>
            <label className="admin_wallet_credit_checkbox">
              <input
                type="checkbox"
                checked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
                disabled={!preflight.canCredit || isBusy}
              />
              Notify user that wallet was funded
            </label>
            <div className="admin_purchase_btn_wrap">
              <button type="submit" disabled={!preflight.canCredit || isProcessing}>
                {isProcessing ? 'Crediting…' : 'Credit wallet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

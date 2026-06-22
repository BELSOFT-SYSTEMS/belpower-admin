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
import '@/styles/adminUserPurchases.css';

type Props = {
  userId: string;
  onCreditComplete?: () => void;
};

export function ManualWalletCreditPanel({ userId, onCreditComplete }: Props) {
  const [preflight, setPreflight] = useState<WalletCreditPreflight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [bankReceivedAt, setBankReceivedAt] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

    setIsSubmitting(true);
    try {
      if (getAdminDemoMode()) {
        toast.info('Demo mode — wallet credit not sent to backend');
        return;
      }

      const result = await creditUserWalletManual(userId, {
        amount: parsedAmount,
        bankReference: bankReference.trim(),
        bankReceivedAt: bankReceivedAt || undefined,
        adminNote: adminNote.trim(),
        notifyUser,
      });

      toast.success(`Wallet credited with ${formatPrice(result.amount)}`);
      setAmount('');
      setBankReference('');
      setBankReceivedAt('');
      setAdminNote('');
      await loadPreflight();
      onCreditComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wallet credit failed');
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="admin_purchase_tab">
      <div className="admin_purchase_preflight admin_panel_card">
        <div>
          <span className="admin_purchase_eyebrow">Wallet balance</span>
          <strong className="admin_purchase_balance">{formatPrice(preflight.walletBalance)}</strong>
        </div>
        <div className="admin_purchase_preflight_meta">
          <span>Status: {preflight.userStatus}</span>
          <span>Max credit allowed now: {formatPrice(preflight.maxCreditAllowed)}</span>
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
              disabled={!preflight.canCredit || isSubmitting}
            />
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="wallet-credit-bank-ref">Bank reference / transaction ID</label>
            <input
              id="wallet-credit-bank-ref"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={!preflight.canCredit || isSubmitting}
            />
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="wallet-credit-received-at">Date received (optional)</label>
            <input
              id="wallet-credit-received-at"
              type="date"
              value={bankReceivedAt}
              onChange={(e) => setBankReceivedAt(e.target.value)}
              disabled={!preflight.canCredit || isSubmitting}
            />
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="wallet-credit-note">Verification note</label>
            <textarea
              id="wallet-credit-note"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="How was this bank transfer verified?"
              disabled={!preflight.canCredit || isSubmitting}
            />
          </div>
          <label className="admin_wallet_credit_checkbox">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              disabled={!preflight.canCredit || isSubmitting}
            />
            Notify user that wallet was funded
          </label>
          <div className="admin_purchase_btn_wrap">
            <button type="submit" disabled={!preflight.canCredit || isSubmitting}>
              {isSubmitting ? 'Crediting…' : 'Credit wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

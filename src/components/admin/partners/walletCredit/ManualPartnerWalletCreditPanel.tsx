'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import {
  creditPartnerWalletManual,
  fetchPartnerWalletCreditPreflight,
  type PartnerWalletCreditPreflight,
} from '@/lib/adminPartnerWalletCredit';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import {
  AdminPurchaseStatusOverlay,
  type AdminPurchaseStatus,
} from '@/components/admin/users/billPurchase/AdminPurchaseStatusOverlay';
import '@/styles/adminUserPurchases.css';

type Props = {
  partnerId: string;
  onCreditComplete?: () => void;
};

type StatusOverlayState = {
  status: AdminPurchaseStatus;
  message?: string;
  reference?: string;
  amount?: number;
};

export function ManualPartnerWalletCreditPanel({ partnerId, onCreditComplete }: Props) {
  const [preflight, setPreflight] = useState<PartnerWalletCreditPreflight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [walletType, setWalletType] = useState<'utility' | 'betting'>('utility');
  const [bankReference, setBankReference] = useState('');
  const [bankReceivedAt, setBankReceivedAt] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notifyPartner, setNotifyPartner] = useState(true);
  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayState | null>(null);

  const isBusy = statusOverlay !== null;
  const isProcessing = statusOverlay?.status === 'processing';

  const loadPreflight = async () => {
    setIsLoading(true);
    try {
      if (getAdminDemoMode()) {
        setPreflight({
          walletBalance: 0,
          utilityBalance: 0,
          bettingBalance: 0,
          partnerStatus: 'active',
          canCredit: true,
          blockReasons: [],
        });
      } else {
        setPreflight(await fetchPartnerWalletCreditPreflight(partnerId));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load partner wallet credit details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPreflight();
  }, [partnerId]);

  const resetForm = () => {
    setAmount('');
    setWalletType('utility');
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
          reference: 'DEMO-PARTNER-WALLET-CREDIT',
          message: 'Demo partner wallet credit simulated successfully.',
        });
        return;
      }

      const result = await creditPartnerWalletManual(partnerId, {
        amount: parsedAmount,
        bankReference: bankReference.trim(),
        bankReceivedAt: bankReceivedAt || undefined,
        adminNote: adminNote.trim(),
        notifyPartner,
        walletType,
      });

      setStatusOverlay({
        status: 'success',
        amount: result.amount,
        reference: result.reference,
        message: `New ${walletType} wallet balance: ${formatPrice(result.walletBalance)}`,
      });
    } catch (err) {
      setStatusOverlay({
        status: 'error',
        message: err instanceof Error ? err.message : 'Partner wallet credit failed',
      });
    }
  };

  const handleStatusComplete = async () => {
    setStatusOverlay(null);
    resetForm();
    await loadPreflight();
    onCreditComplete?.();
  };

  if (isLoading) {
    return (
      <section className="partner_wallet_credit_panel partner_wallet_credit_panel_manual">
        <div className="partner_wallet_credit_loading">
          <Loader2 className="animate-spin" aria-hidden />
          Loading partner wallet credit details…
        </div>
      </section>
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
        onRetry={statusOverlay?.status === 'error' ? () => setStatusOverlay(null) : undefined}
        onDismiss={statusOverlay?.status === 'error' ? () => setStatusOverlay(null) : undefined}
      />

      <section className="partner_wallet_credit_panel partner_wallet_credit_panel_manual">
        <header className="partner_wallet_credit_panel_header">
          <div>
            <span className="partner_wallet_credit_eyebrow">Manual credit</span>
            <h3 className="partner_wallet_credit_title">Manual partner wallet credit</h3>
            <p className="partner_wallet_credit_intro">
              Credit the Utility or Betting wallet after verifying a bank transfer outside the deposit
              request flow. Bank reference and a verification note are required for audit.
            </p>
          </div>
        </header>

        {!preflight.canCredit && preflight.blockReasons.length > 0 ? (
          <div className="admin_panel_alert admin_panel_alert_warning partner_wallet_credit_alert">
            {preflight.blockReasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        ) : null}

        <div className="admin_purchase_field_group" style={{ marginBottom: 12 }}>
          <p className="text-sm text-gray-600">
            Utility: <strong>{formatPrice(preflight.utilityBalance ?? preflight.walletBalance)}</strong>
            {' · '}
            Betting: <strong>{formatPrice(preflight.bettingBalance ?? 0)}</strong>
          </p>
        </div>

        <form className="admin_wallet_credit_form" onSubmit={(e) => void handleSubmit(e)}>
          <div className="admin_purchase_field_group">
            <label htmlFor="partner-wallet-credit-type">Wallet to credit</label>
            <select
              id="partner-wallet-credit-type"
              value={walletType}
              onChange={(e) => setWalletType(e.target.value as 'utility' | 'betting')}
              disabled={!preflight.canCredit || isBusy}
            >
              <option value="utility">Utility Wallet (airtime, data, electricity, cable)</option>
              <option value="betting">Betting Wallet (Swita)</option>
            </select>
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="partner-wallet-credit-amount">Amount to credit (₦)</label>
            <input
              id="partner-wallet-credit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!preflight.canCredit || isBusy}
            />
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="partner-wallet-credit-bank-ref">Bank reference / transaction ID</label>
            <input
              id="partner-wallet-credit-bank-ref"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              disabled={!preflight.canCredit || isBusy}
            />
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="partner-wallet-credit-received-at">Date received (optional)</label>
            <input
              id="partner-wallet-credit-received-at"
              type="date"
              value={bankReceivedAt}
              onChange={(e) => setBankReceivedAt(e.target.value)}
              disabled={!preflight.canCredit || isBusy}
            />
          </div>
          <div className="admin_purchase_field_group">
            <label htmlFor="partner-wallet-credit-note">Verification note</label>
            <textarea
              id="partner-wallet-credit-note"
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
              checked={notifyPartner}
              onChange={(e) => setNotifyPartner(e.target.checked)}
              disabled={!preflight.canCredit || isBusy}
            />
            Notify partner that wallet was funded
          </label>
          <div className="partner_wallet_credit_form_actions">
            <button
              type="submit"
              className="partner_wallet_credit_btn partner_wallet_credit_btn_primary"
              disabled={!preflight.canCredit || isProcessing}
            >
              {isProcessing ? 'Crediting…' : 'Credit partner wallet'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

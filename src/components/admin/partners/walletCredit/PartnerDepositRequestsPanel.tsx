'use client';

import { useEffect, useState } from 'react';
import { Clock3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import {
  approvePartnerDepositRequest,
  fetchPartnerDepositRequests,
  rejectPartnerDepositRequest,
  type PartnerDepositRequestAdminItem,
} from '@/lib/adminPartnerWalletCredit';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import '@/styles/adminUserPurchases.css';

type Props = {
  partnerId?: string;
  onUpdated?: () => void;
};

export function PartnerDepositRequestsPanel({ partnerId, onUpdated }: Props) {
  const [items, setItems] = useState<PartnerDepositRequestAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bankReferences, setBankReferences] = useState<Record<string, string>>({});

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPartnerDepositRequests('pending');
      setItems(
        partnerId ? data.items.filter((item) => item.partnerId === partnerId) : data.items
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load deposit requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [partnerId]);

  const handleApprove = async (item: PartnerDepositRequestAdminItem) => {
    const bankReference = (bankReferences[item.id] || item.bankReference || '').trim();
    if (!bankReference) {
      toast.error('Bank reference is required to approve');
      return;
    }

    setBusyId(item.id);
    try {
      await approvePartnerDepositRequest(item.id, {
        bankReference,
        adminNote: 'Approved partner bank transfer deposit',
      });
      toast.success(
        `Deposit approved. Wallet credited ${formatPrice(
          item.expectedWalletCredit ?? item.amount
        )}${item.feeWaived ? ' in full' : ''}`
      );
      await load();
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve deposit');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item: PartnerDepositRequestAdminItem) => {
    setBusyId(item.id);
    try {
      await rejectPartnerDepositRequest(item.id, {
        reason: 'Deposit could not be verified',
      });
      toast.success('Deposit request rejected');
      await load();
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject deposit');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="partner_wallet_credit_panel partner_wallet_credit_panel_deposits">
      <header className="partner_wallet_credit_panel_header">
        <div>
          <span className="partner_wallet_credit_eyebrow">Deposit queue</span>
          <h3 className="partner_wallet_credit_title">Pending deposit requests</h3>
          <p className="partner_wallet_credit_intro">
            Review bank transfers submitted from the partner portal. Approve after verifying the
            payment on your bank statement.
          </p>
        </div>
        {!isLoading && items.length > 0 ? (
          <span className="partner_wallet_credit_count" aria-label={`${items.length} pending`}>
            {items.length}
          </span>
        ) : null}
      </header>

      {isLoading ? (
        <div className="partner_wallet_credit_loading">
          <Loader2 className="animate-spin" aria-hidden />
          Loading pending deposits…
        </div>
      ) : items.length === 0 ? (
        <div className="partner_wallet_credit_empty">
          <p>No pending deposit requests for this partner.</p>
        </div>
      ) : (
        <ul className="partner_deposit_request_list">
          {items.map((item) => {
            const creditAmount = item.expectedWalletCredit ?? Math.max(0, item.amount - 50);

            return (
              <li key={item.id} className="partner_deposit_request_card">
                <div className="partner_deposit_request_top">
                  <div>
                    <p className="partner_deposit_request_amount">{formatPrice(item.amount)}</p>
                    <p className="partner_deposit_request_partner">
                      {item.partner?.businessName || 'Partner'}
                    </p>
                    <p className="partner_deposit_request_meta">{item.partner?.email}</p>
                  </div>
                  <span
                    className={
                      item.feeWaived
                        ? 'partner_deposit_request_badge partner_deposit_request_badge_waived'
                        : 'partner_deposit_request_badge'
                    }
                  >
                    {item.feeWaived
                      ? 'Fee waived'
                      : `Credits ${formatPrice(creditAmount)}`}
                  </span>
                </div>

                <p className="partner_deposit_request_credit_line">
                  {item.feeWaived
                    ? `Full ${formatPrice(item.amount)} will be credited (deposit charge waived above ₦100,000).`
                    : `₦50 deposit charge applies — wallet receives ${formatPrice(creditAmount)}.`}
                </p>

                <p className="partner_deposit_request_time">
                  <Clock3 size={14} aria-hidden />
                  Submitted {formatAdminDateTime(item.createdAt)}
                </p>

                <div className="admin_purchase_field_group partner_deposit_request_field">
                  <label htmlFor={`bank-ref-${item.id}`}>Bank reference</label>
                  <input
                    id={`bank-ref-${item.id}`}
                    defaultValue={item.bankReference || ''}
                    onChange={(e) =>
                      setBankReferences((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    disabled={busyId === item.id}
                    placeholder="Enter verified transaction reference"
                  />
                </div>

                <div className="partner_deposit_request_actions">
                  <button
                    type="button"
                    className="partner_wallet_credit_btn partner_wallet_credit_btn_primary"
                    disabled={busyId === item.id}
                    onClick={() => void handleApprove(item)}
                  >
                    Approve &amp; credit wallet
                  </button>
                  <button
                    type="button"
                    className="partner_wallet_credit_btn partner_wallet_credit_btn_danger"
                    disabled={busyId === item.id}
                    onClick={() => void handleReject(item)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

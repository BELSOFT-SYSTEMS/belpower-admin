'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Clock3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import { AuthApiError } from '@/lib/adminAuth';
import {
  approvePartnerDepositRequest,
  fetchPartnerDepositProof,
  fetchPartnerDepositRequests,
  rejectPartnerDepositRequest,
  type PartnerDepositRequestAdminItem,
} from '@/lib/adminPartnerWalletCredit';
import { formatRecordAdminDateTime } from '@/utils/formatAdminDate';
import '@/styles/adminUserPurchases.css';
import '@/styles/adminPartners.css';

type Props = {
  partnerId?: string;
  onUpdated?: () => void;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AuthApiError) {
    if (error.code === 'PROOF_OF_PAYMENT_NOT_FOUND') {
      return 'No proof of payment was uploaded for this deposit request.';
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function PartnerDepositRequestsPanel({ partnerId, onUpdated }: Props) {
  const [items, setItems] = useState<PartnerDepositRequestAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proofLoadingId, setProofLoadingId] = useState<string | null>(null);
  const [proofErrors, setProofErrors] = useState<Record<string, string>>({});
  const [proofPreview, setProofPreview] = useState<{
    open: boolean;
    imageUrl: string;
    title: string;
  }>({ open: false, imageUrl: '', title: '' });

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPartnerDepositRequests('pending');
      setItems(
        partnerId ? data.items.filter((item) => item.partnerId === partnerId) : data.items
      );
      setProofErrors({});
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load deposit requests'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [partnerId]);

  const handleApprove = async (item: PartnerDepositRequestAdminItem) => {
    setBusyId(item.id);
    try {
      await approvePartnerDepositRequest(item.id, {
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
      toast.error(getErrorMessage(error, 'Failed to approve deposit'));
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
      toast.error(getErrorMessage(error, 'Failed to reject deposit'));
    } finally {
      setBusyId(null);
    }
  };

  const handleViewProof = async (item: PartnerDepositRequestAdminItem) => {
    if (item.proofOfPayment?.imageUrl) {
      setProofErrors((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setProofPreview({
        open: true,
        imageUrl: item.proofOfPayment.imageUrl,
        title: item.partner?.businessName || 'Partner deposit proof',
      });
      return;
    }

    setProofLoadingId(item.id);
    setProofErrors((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    try {
      const proof = await fetchPartnerDepositProof(item.id);
      if (!proof.proofOfPayment?.imageUrl) {
        const message = 'No proof of payment was uploaded for this deposit request.';
        setProofErrors((prev) => ({ ...prev, [item.id]: message }));
        toast.error(message);
        return;
      }

      setProofPreview({
        open: true,
        imageUrl: proof.proofOfPayment.imageUrl,
        title: item.partner?.businessName || 'Partner deposit proof',
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load proof of payment');
      setProofErrors((prev) => ({ ...prev, [item.id]: message }));
      toast.error(message);
    } finally {
      setProofLoadingId(null);
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
            const submittedAt = formatRecordAdminDateTime(item, 'createdAt', 'created_at');
            const isBusy = busyId === item.id || proofLoadingId === item.id;

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

                {submittedAt !== '—' ? (
                  <p className="partner_deposit_request_time">
                    <Clock3 size={14} aria-hidden />
                    Submitted {submittedAt}
                  </p>
                ) : null}

                {proofErrors[item.id] ? (
                  <p className="partner_deposit_proof_error" role="alert">
                    {proofErrors[item.id]}
                  </p>
                ) : null}

                <div className="partner_deposit_request_actions">
                  <button
                    type="button"
                    className="partner_wallet_credit_btn partner_wallet_credit_btn_info"
                    disabled={isBusy}
                    onClick={() => void handleViewProof(item)}
                  >
                    {proofLoadingId === item.id ? 'Loading proof…' : 'View proof'}
                  </button>
                  <button
                    type="button"
                    className="partner_wallet_credit_btn partner_wallet_credit_btn_primary"
                    disabled={isBusy}
                    onClick={() => void handleApprove(item)}
                  >
                    Approve &amp; credit wallet
                  </button>
                  <button
                    type="button"
                    className="partner_wallet_credit_btn partner_wallet_credit_btn_danger"
                    disabled={isBusy}
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
      {proofPreview.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">{proofPreview.title}</h4>
              <button
                type="button"
                className="partner_wallet_credit_btn partner_wallet_credit_btn_info"
                onClick={() => setProofPreview({ open: false, imageUrl: '', title: '' })}
              >
                Close
              </button>
            </div>
            <div className="relative h-[70vh] w-full">
              <Image
                src={proofPreview.imageUrl}
                alt="Proof of payment"
                fill
                className="rounded-lg object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

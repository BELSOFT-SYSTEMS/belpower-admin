'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import {
  approvePartnerDepositRequest,
  fetchPartnerDepositRequests,
  rejectPartnerDepositRequest,
  type PartnerDepositRequestAdminItem,
} from '@/lib/adminPartnerWalletCredit';
import { formatAdminDateTime } from '@/utils/formatAdminDate';

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
      toast.success('Deposit approved and wallet credited');
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

  if (isLoading) {
    return (
      <div className="admin_purchase_loading">
        <Loader2 className="animate-spin" /> Loading pending deposits…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="admin_panel_card">
        <h3 className="admin_purchase_subheading">Pending deposit requests</h3>
        <p className="admin_form_hint">No pending partner deposit requests.</p>
      </div>
    );
  }

  return (
    <div className="admin_panel_card">
      <h3 className="admin_purchase_subheading">Pending deposit requests</h3>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {item.partner?.businessName || 'Partner'} · {formatPrice(item.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  {item.partner?.email} · {formatAdminDateTime(item.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-gray-700" htmlFor={`bank-ref-${item.id}`}>
                Bank reference
              </label>
              <input
                id={`bank-ref-${item.id}`}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                defaultValue={item.bankReference || ''}
                onChange={(e) =>
                  setBankReferences((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                disabled={busyId === item.id}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={busyId === item.id}
                onClick={() => void handleApprove(item)}
              >
                Approve & credit
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={busyId === item.id}
                onClick={() => void handleReject(item)}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

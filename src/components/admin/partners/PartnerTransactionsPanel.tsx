'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPartnerTransactions } from '@/lib/adminPartners';
import type { PartnerTransactionItem } from '@/types/adminPartners';
import { formatAdminDateTime } from '@/utils/formatAdminDate';

type PartnerTransactionsPanelProps = {
  partnerId: string;
};

function statusClass(status: string): string {
  if (status === 'completed') return 'pill pill_active';
  if (status === 'pending' || status === 'scheduled') return 'pill pill_pending';
  if (status === 'failed') return 'pill pill_blocked';
  return 'pill pill_inactive';
}

export function PartnerTransactionsPanel({ partnerId }: PartnerTransactionsPanelProps) {
  const [items, setItems] = useState<PartnerTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getPartnerTransactions(partnerId);
        if (!cancelled) setItems(data.items);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load transactions');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-black mb-2">Transactions</h2>
        <p className="text-sm text-gray-600">No API purchases recorded for this partner yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-black mb-4">Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Service</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-3 font-mono text-xs">{item.reference}</td>
                <td className="px-3 py-3 capitalize">{item.service_type}</td>
                <td className="px-3 py-3">₦{item.amount.toLocaleString()}</td>
                <td className="px-3 py-3">
                  <span className={statusClass(item.status)}>{item.status}</span>
                </td>
                <td className="px-3 py-3 text-gray-600">{formatAdminDateTime(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

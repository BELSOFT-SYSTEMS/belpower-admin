'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaArrowLeft, FaHandshake } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/adminShared.css';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  approvePartner,
  blockPartner,
  deactivatePartner,
  getPartnerDetail,
  rejectPartner,
  unblockPartner,
} from '@/lib/adminPartners';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import type { PartnerDetail, PartnerStatus } from '@/types/adminPartners';

function statusClass(status: PartnerStatus): string {
  if (status === 'active') return 'pill pill_active';
  if (status === 'pending_review') return 'pill pill_pending';
  if (status === 'rejected' || status === 'blocked') return 'pill pill_blocked';
  return 'pill pill_inactive';
}

export default function PartnerDetailPage() {
  const params = useParams<{ partnerId: string }>();
  const { canAccess } = useAdminAuth();
  const canView = canAccess('partners.detail');
  const canManage = canAccess('partners.approve');
  const partnerId = params.partnerId;

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const refresh = async () => {
    const data = await getPartnerDetail(partnerId);
    setPartner(data);
  };

  useEffect(() => {
    if (!canView || !partnerId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPartnerDetail(partnerId);
        if (!cancelled) setPartner(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load partner');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [canView, partnerId]);

  const runAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    setBusyAction(actionKey);
    try {
      await action();
      toast.success(successMessage);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleApprove = (event: FormEvent) => {
    event.preventDefault();
    if (!partner) return;

    runAction(
      'approve',
      () => approvePartner({ partnerId: partner.id, note: note.trim() || undefined }),
      'Partner approved successfully'
    );
  };

  const handleReject = (event: FormEvent) => {
    event.preventDefault();
    if (!partner) return;

    runAction(
      'reject',
      () =>
        rejectPartner({
          partnerId: partner.id,
          reason: reason.trim() || 'Application rejected',
        }),
      'Partner rejected'
    );
  };

  if (!canView) {
    return (
      <div className="pb-10">
        <h1 className="text-2xl font-semibold text-black mb-4">Partner detail</h1>
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="pb-10">
        <Link
          href="/command-center/partners"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
        >
          <FaArrowLeft /> Back to partners
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Partner not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <Link
        href="/command-center/partners"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
      >
        <FaArrowLeft /> Back to partners
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-black flex items-center gap-2">
            <FaHandshake className="text-blue-600" />
            {partner.businessName}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{partner.agentFullName}</p>
        </div>
        <span className={statusClass(partner.status)}>{partner.status.replace(/_/g, ' ')}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-black mb-3">Business details</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-gray-500">CAC number</dt>
              <dd className="font-medium text-gray-900">{partner.cacRegistrationNumber}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{partner.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{partner.phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Applied</dt>
              <dd className="font-medium text-gray-900">{formatAdminDateTime(partner.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last login</dt>
              <dd className="font-medium text-gray-900">
                {partner.lastLoginAt ? formatAdminDateTime(partner.lastLoginAt) : 'Never'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Wallet balance</dt>
              <dd className="font-medium text-gray-900">
                ₦{partner.walletBalance.toLocaleString()}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-black mb-3">API keys</h2>
          {partner.apiKeys.length === 0 ? (
            <p className="text-sm text-gray-600">
              No API keys yet. Keys are issued when the partner is approved.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {partner.apiKeys.map((key) => (
                <li key={key.id} className="rounded-md bg-gray-50 px-3 py-2">
                  <strong className="capitalize">{key.keyType}</strong>: {key.label}{' '}
                  {key.isActive ? '(active)' : '(inactive)'}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {canManage ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {partner.status === 'pending_review' ? (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-black mb-3">Approve application</h2>
                <form onSubmit={handleApprove} className="space-y-3">
                  <label htmlFor="approval-note" className="block text-sm text-gray-700">
                    Internal note (optional)
                  </label>
                  <textarea
                    id="approval-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={busyAction !== null}
                  >
                    {busyAction === 'approve' ? 'Approving…' : 'Approve partner'}
                  </button>
                </form>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-black mb-3">Reject application</h2>
                <form onSubmit={handleReject} className="space-y-3">
                  <label htmlFor="reject-reason" className="block text-sm text-gray-700">
                    Reason
                  </label>
                  <textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={busyAction !== null}
                  >
                    {busyAction === 'reject' ? 'Rejecting…' : 'Reject partner'}
                  </button>
                </form>
              </section>
            </>
          ) : null}

          {partner.status === 'active' ? (
            <section className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
              <h2 className="text-lg font-semibold text-black mb-3">Account controls</h2>
              <div className="space-y-3">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for block or deactivation"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={busyAction !== null}
                    onClick={() =>
                      runAction(
                        'block',
                        () =>
                          blockPartner({
                            partnerId: partner.id,
                            reason: reason.trim() || undefined,
                          }),
                        'Partner blocked'
                      )
                    }
                  >
                    Block
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={busyAction !== null}
                    onClick={() =>
                      runAction(
                        'deactivate',
                        () =>
                          deactivatePartner({
                            partnerId: partner.id,
                            reason: reason.trim() || undefined,
                          }),
                        'Partner deactivated'
                      )
                    }
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {partner.status === 'blocked' ? (
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-black mb-3">Unblock partner</h2>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={busyAction !== null}
                onClick={() =>
                  runAction(
                    'unblock',
                    () => unblockPartner(partner.id),
                    'Partner unblocked'
                  )
                }
              >
                {busyAction === 'unblock' ? 'Unblocking…' : 'Unblock partner'}
              </button>
            </section>
          ) : null}
        </div>
      ) : null}

      {partner.rejectionReason ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 mt-4">
          <h2 className="text-lg font-semibold text-black mb-2">Rejection reason</h2>
          <p className="text-sm text-gray-700">{partner.rejectionReason}</p>
        </section>
      ) : null}
    </div>
  );
}

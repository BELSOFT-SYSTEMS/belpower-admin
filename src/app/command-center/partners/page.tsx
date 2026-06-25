'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaHandshake, FaSearch } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminShared.css';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getPartnersList } from '@/lib/adminPartners';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import type { PartnerListItem, PartnerStatus } from '@/types/adminPartners';

const STATUS_OPTIONS: Array<{ value: PartnerStatus | '__all__'; label: string }> = [
  { value: '__all__', label: 'All statuses' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'deactivated', label: 'Deactivated' },
];

function statusClass(status: PartnerStatus): string {
  if (status === 'active') return 'pill pill_active';
  if (status === 'pending_review') return 'pill pill_pending';
  if (status === 'rejected' || status === 'blocked') return 'pill pill_blocked';
  return 'pill pill_inactive';
}

function formatStatusLabel(status: PartnerStatus): string {
  return status.replace(/_/g, ' ');
}

export default function PartnersPage() {
  const { canAccess } = useAdminAuth();
  const canView = canAccess('partners.list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | '__all__'>('pending_review');
  const [page, setPage] = useState(1);
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPartnersList({
          page,
          search,
          status: statusFilter,
        });

        if (cancelled) return;
        setPartners(data.partners);
        setPagination(data.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load partners');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [canView, page, search, statusFilter]);

  if (!canView) {
    return (
      <div className="pb-10">
        <h1 className="text-2xl font-semibold text-black mb-4">Partners</h1>
        <p className="text-gray-500">You do not have permission to view partner applications.</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black flex items-center gap-2">
          <FaHandshake className="text-blue-600" />
          Partners
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Review partner onboarding applications and manage account status.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business, agent, email, phone, CAC..."
            aria-label="Search partners"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PartnerStatus | '__all__')}
          aria-label="Filter by status"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No partners found for the current filters.
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{partner.businessName}</div>
                        <div className="text-xs text-gray-500">{partner.cacRegistrationNumber}</div>
                      </td>
                      <td className="px-4 py-3">{partner.agentFullName}</td>
                      <td className="px-4 py-3">
                        <div>{partner.email}</div>
                        <div className="text-xs text-gray-500">{partner.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusClass(partner.status)}>
                          {formatStatusLabel(partner.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatAdminDateTime(partner.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/command-center/partners/${partner.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

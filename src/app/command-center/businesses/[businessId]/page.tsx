'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { FaBuilding, FaUsers, FaWallet } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import '@/styles/adminUserDetails.css';
import '@/styles/adminTransactions.css';
import '@/styles/adminPartners.css';
import '@/styles/adminShared.css';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { AdminBackButton } from '@/components/admin/ui/AdminBackButton';
import { AdminCopyableValue } from '@/components/admin/ui/AdminCopyableValue';
import { AdminTransactionsListPanel } from '@/components/admin/transactions/AdminTransactionsListPanel';
import { getBusinessDetail } from '@/lib/adminBusinesses';
import type { BusinessDetail } from '@/types/adminBusinesses';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { formatPrice } from '@/utils/FormatPrice';
import { getAvatarBackground, getInitialsFromDisplayName } from '@/utils/userAvatar';

type TabId = 'overview' | 'transactions';

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = String(params?.businessId || '');
  const [tab, setTab] = useState<TabId>('overview');
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBusinessDetail(businessId);
        if (!cancelled) setBusiness(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load business');
          setBusiness(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const tabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview' },
      { id: 'transactions' as const, label: 'Transactions' },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="admin_user_details_page">
        <div className="admin_users_loading">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading business…</span>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="admin_user_details_page">
        <AdminBackButton defaultHref="/command-center/businesses" defaultLabel="Back to businesses" />
        <p className="admin_users_error">{error || 'Business not found'}</p>
      </div>
    );
  }

  return (
    <div className="admin_user_details_page">
      <AdminBackButton defaultHref="/command-center/businesses" defaultLabel="Back to businesses" />

      <div className="admin_user_details_header">
        <span
          className="admin_users_avatar admin_users_avatar_lg"
          style={{ backgroundColor: getAvatarBackground(business.id), color: '#fff' }}
        >
          {getInitialsFromDisplayName(business.businessName)}
        </span>
        <div>
          <h1 className="admin_user_details_title">{business.businessName}</h1>
          <p className="admin_user_details_subtitle">
            {business.businessId} · {business.email}
          </p>
          <span className={`status_pill status_${business.status}`}>{business.status}</span>
        </div>
      </div>

      <AdminTabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'overview' ? (
        <div className="overview_grid">
          <section className="overview_section">
            <h2 className="overview_section_title">Company</h2>
            <div className="overview_rows">
              <div className="overview_row">
                <span className="overview_label">Business code</span>
                <AdminCopyableValue value={business.businessId} />
              </div>
              <div className="overview_row">
                <span className="overview_label">Email</span>
                <span className="overview_value">{business.email}</span>
              </div>
              <div className="overview_row">
                <span className="overview_label">Phone</span>
                <span className="overview_value">{business.phone}</span>
              </div>
              <div className="overview_row">
                <span className="overview_label">Address</span>
                <span className="overview_value">{business.address}</span>
              </div>
              <div className="overview_row">
                <span className="overview_label">Created</span>
                <span className="overview_value">
                  {business.createdAt ? formatAdminDateTime(business.createdAt) : '—'}
                </span>
              </div>
            </div>
          </section>

          <section className="overview_section">
            <h2 className="overview_section_title">
              <FaWallet className="inline mr-2" />
              Wallet
            </h2>
            <div className="overview_rows">
              <div className="overview_row">
                <span className="overview_label">Company balance</span>
                <span className="overview_value">
                  {formatPrice(business.companyWallet?.availableBalance ?? 0)}
                </span>
              </div>
              <div className="overview_row">
                <span className="overview_label">Wallet status</span>
                <span className="overview_value">{business.companyWallet?.status || '—'}</span>
              </div>
              <div className="overview_row">
                <span className="overview_label">Completed debit volume</span>
                <span className="overview_value">
                  {formatPrice(business.stats.completedDebitVolume)}
                </span>
              </div>
              <div className="overview_row">
                <span className="overview_label">Transactions</span>
                <span className="overview_value">{business.stats.transactionCount}</span>
              </div>
            </div>
          </section>

          <section className="overview_section">
            <h2 className="overview_section_title">
              <FaUsers className="inline mr-2" />
              Team ({business.users.length})
            </h2>
            {business.users.length === 0 ? (
              <p className="text-sm text-gray-500">No team members.</p>
            ) : (
              <ul className="space-y-2">
                {business.users.map((user) => (
                  <li key={user.id} className="text-sm">
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>{' '}
                    · {user.role} · {user.email}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overview_section">
            <h2 className="overview_section_title">Branches ({business.branches.length})</h2>
            {business.branches.length === 0 ? (
              <p className="text-sm text-gray-500">No branches.</p>
            ) : (
              <ul className="space-y-2">
                {business.branches.map((branch) => (
                  <li key={branch.id} className="text-sm">
                    <span className="font-medium">{branch.name}</span>
                    {branch.isHeadOffice ? ' (Head Office)' : ''}
                    {branch.city ? ` · ${branch.city}` : ''}
                    {branch.meterNumber ? ` · Meter ${branch.meterNumber}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <AdminTransactionsListPanel
          businessId={business.id}
          showUser={false}
          listTitle="Business transactions"
          searchPlaceholder="Search business transactions…"
        />
      )}
    </div>
  );
}

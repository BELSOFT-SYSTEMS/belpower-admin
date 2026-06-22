'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/FormatPrice';
import {
  fetchPurchasePreflight,
  purchaseBillForUser,
  type AdminPurchaseResult,
  type AdminPurchaseService,
  type PurchasePreflight,
} from '@/lib/adminUserPurchases';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { AdminUserPurchaseModal } from '@/components/admin/users/billPurchase/AdminUserPurchaseModal';
import '@/styles/adminUserPurchases.css';

const SERVICES: {
  id: AdminPurchaseService;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
}[] = [
  {
    id: 'airtime',
    label: 'Airtime',
    description: 'Top up phone credit from wallet',
    icon: '/airtime.png',
    colorClass: 'admin_purchase_card_airtime',
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Buy data bundle from wallet',
    icon: '/data.png',
    colorClass: 'admin_purchase_card_data',
  },
  {
    id: 'electricity',
    label: 'Electricity',
    description: 'Vend prepaid meter token',
    icon: '/electricity.png',
    colorClass: 'admin_purchase_card_electricity',
  },
  {
    id: 'cable',
    label: 'Cable TV',
    description: 'Renew cable subscription',
    icon: '/Tv.png',
    colorClass: 'admin_purchase_card_cable',
  },
];

type Props = {
  userId: string;
  userEmail?: string | null;
  userPhone?: string | null;
  userName?: string | null;
  onPurchaseComplete?: () => void;
};

export function BillPurchaseTab({ userId, userEmail, userPhone, userName, onPurchaseComplete }: Props) {
  const [preflight, setPreflight] = useState<PurchasePreflight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<AdminPurchaseService | null>(null);

  const loadPreflight = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (getAdminDemoMode()) {
        setPreflight({
          walletBalance: 12500,
          userStatus: 'active',
          displayStatus: 'active',
          isBlocked: false,
          isSuspended: false,
          isSuspicious: false,
          maintenance: {
            airtime: true,
            data: true,
            electricity: true,
            cable: true,
          },
          canPurchase: true,
          blockReasons: [],
          maxSingleTransaction: 200101,
        });
      } else {
        setPreflight(await fetchPurchasePreflight(userId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPreflight();
  }, [userId]);

  const serviceDisabled = useMemo(() => {
    if (!preflight) return () => true;
    return (service: AdminPurchaseService) =>
      !preflight.canPurchase || !preflight.maintenance[service];
  }, [preflight]);

  const handlePurchase = async (
    service: AdminPurchaseService,
    payload: Record<string, unknown>
  ): Promise<AdminPurchaseResult> => {
    if (getAdminDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return {
        status: 'completed',
        pending: false,
        amount: Number(payload.amount) || undefined,
        reference: 'DEMO-REF-001',
        message: 'Demo purchase simulated successfully.',
      };
    }

    return purchaseBillForUser(userId, service, payload);
  };

  const handlePurchaseComplete = async () => {
    setActiveService(null);
    await loadPreflight();
    onPurchaseComplete?.();
  };

  if (isLoading) {
    return (
      <div className="admin_purchase_loading">
        <Loader2 className="animate-spin" /> Loading purchase details…
      </div>
    );
  }

  if (error) {
    return <div className="admin_panel_alert admin_panel_alert_error">{error}</div>;
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
          <span>Status: {preflight.displayStatus}</span>
          <span>Max single purchase: {formatPrice(preflight.maxSingleTransaction)}</span>
        </div>
        {!preflight.canPurchase && preflight.blockReasons.length > 0 && (
          <div className="admin_panel_alert admin_panel_alert_warning">
            {preflight.blockReasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        )}
        {preflight.isSuspicious && (
          <div className="admin_panel_alert admin_panel_alert_warning">
            This user is flagged for suspicious activity. Purchases still follow normal fraud limits.
          </div>
        )}
      </div>

      <div className="admin_purchase_grid">
        {SERVICES.map((service) => {
          const disabled = serviceDisabled(service.id);
          return (
            <button
              key={service.id}
              type="button"
              className={`admin_purchase_card ${service.colorClass}`}
              disabled={disabled}
              onClick={() => setActiveService(service.id)}
            >
              <figure className="admin_purchase_card_icon">
                <Image src={service.icon} alt="" width={24} height={24} />
              </figure>
              <strong>{service.label}</strong>
              <span>{service.description}</span>
              {!preflight.maintenance[service.id] && (
                <em className="admin_purchase_unavailable">Service unavailable</em>
              )}
            </button>
          );
        })}
      </div>

      {activeService && preflight && (
        <AdminUserPurchaseModal
          service={activeService}
          userEmail={userEmail}
          userPhone={userPhone}
          userName={userName}
          preflight={preflight}
          onClose={() => setActiveService(null)}
          onSubmit={(payload) => handlePurchase(activeService, payload)}
          onComplete={handlePurchaseComplete}
        />
      )}
    </div>
  );
}

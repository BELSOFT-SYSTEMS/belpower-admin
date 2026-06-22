import {
  getAdminById,
  getAdminLogs,
  getAdmins,
} from '@/data/adminManagementMock';
import {
  getNotificationTemplates,
  getSentNotifications,
  NIGERIAN_STATES,
  DISCO_OPTIONS,
} from '@/data/adminNotificationsMock';
import { maintenanceStateToFlags } from '@/lib/adminMaintenance';
import type { AdminInboxResult } from '@/lib/adminInboxNotifications';
import type { AdminsListData } from '@/lib/normalizeAdminAccounts';
import type { MaintenanceState } from '@/types/adminMaintenance';
import type { AdminInboxNotification } from '@/types/adminInboxNotifications';
import type { ServiceReliabilityData } from '@/types/adminServiceReliability';

const DEMO_MAINTENANCE_STATE: MaintenanceState = {
  userLogin: true,
  userPurchase: true,
  walletFunding: true,
  paystackDva: true,
  buyPowerDva: true,
  services: {
    airtime: true,
    data: true,
    electricity: true,
    cable: true,
  },
};

export function getMockMaintenanceState(): MaintenanceState {
  return { ...DEMO_MAINTENANCE_STATE };
}

export function getMockMaintenanceFlags() {
  return maintenanceStateToFlags(getMockMaintenanceState());
}

export function getMockServiceReliability(): ServiceReliabilityData {
  const providers = [
    { vertical: 'ELECTRICITY', verticalLabel: 'Electricity', discoCode: 'IKEDC', displayName: 'IKEDC', successPercentage: 98.2, pendingPercentage: 1.1, failurePercentage: 0.7, providerOnline: true, health: 'healthy' as const },
    { vertical: 'ELECTRICITY', verticalLabel: 'Electricity', discoCode: 'EKEDC', displayName: 'EKEDC', successPercentage: 96.4, pendingPercentage: 2.0, failurePercentage: 1.6, providerOnline: true, health: 'watch' as const },
    { vertical: 'VTU', verticalLabel: 'Airtime', discoCode: 'MTN', displayName: 'MTN', successPercentage: 99.1, pendingPercentage: 0.5, failurePercentage: 0.4, providerOnline: true, health: 'healthy' as const },
    { vertical: 'DATA', verticalLabel: 'Data', discoCode: 'AIRTEL', displayName: 'Airtel Data', successPercentage: 97.8, pendingPercentage: 1.4, failurePercentage: 0.8, providerOnline: true, health: 'healthy' as const },
    { vertical: 'TV', verticalLabel: 'Cable TV', discoCode: 'DSTV', displayName: 'DStv', successPercentage: 94.5, pendingPercentage: 3.0, failurePercentage: 2.5, providerOnline: false, health: 'degraded' as const },
  ];

  return {
    providers,
    summary: {
      healthy: providers.filter((item) => item.health === 'healthy').length,
      watch: providers.filter((item) => item.health === 'watch').length,
      degraded: providers.filter((item) => item.health === 'degraded').length,
      offline: providers.filter((item) => !item.providerOnline).length,
      total: providers.length,
    },
    fetchedAt: new Date().toISOString(),
  };
}

export function getMockAdminsList(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): AdminsListData {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const search = params.search?.trim().toLowerCase() ?? '';

  const filtered = getAdmins().filter((admin) => {
    if (!search) return true;
    const haystack = `${admin.first_name} ${admin.last_name} ${admin.email}`.toLowerCase();
    return haystack.includes(search);
  });

  const total = filtered.length;
  const start = (page - 1) * limit;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    admins: filtered.slice(start, start + limit),
    total,
    page,
    totalPages,
  };
}

export function getMockAdminDetail(adminId: string) {
  return getAdminById(adminId) ?? null;
}

export function getMockAdminActivityLogs(adminId: string) {
  return { logs: getAdminLogs(adminId), total: getAdminLogs(adminId).length };
}

export function getMockNotificationTemplates() {
  return getNotificationTemplates();
}

export function getMockAudienceOptions() {
  return {
    states: [...NIGERIAN_STATES],
    providers: DISCO_OPTIONS.map((option) => ({
      code: option.code,
      label: option.label,
      category: 'electricity' as const,
    })),
  };
}

export function getMockNotificationHistory() {
  return getSentNotifications();
}

export function getMockNotificationStats(scope: 'mine' | 'all' = 'all') {
  return {
    scope,
    can_view_all: true,
    sent_today: 3,
    last_broadcast_reach: 1840,
    total_sent: getSentNotifications().length,
  };
}

export function getMockNotificationUsers(search: string) {
  const query = search.trim().toLowerCase();
  return getAdmins()
    .filter((admin) => {
      const haystack = `${admin.first_name} ${admin.last_name} ${admin.email}`.toLowerCase();
      return !query || haystack.includes(query);
    })
    .slice(0, 8)
    .map((admin) => ({
      id: admin.id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
    }));
}

export function getMockAdminInbox(): AdminInboxResult {
  const notifications: AdminInboxNotification[] = [
    {
      id: 'demo-inbox-1',
      title: 'Flagged transaction',
      message: 'BP-DEMO-88417 needs review.',
      type: 'system',
      priority: 'high',
      is_read: false,
      created_at: new Date().toISOString(),
      action_url: '/command-center/transactions/demo-txn-005',
    },
    {
      id: 'demo-inbox-2',
      title: 'New user signup',
      message: 'Amina Yusuf joined BuyPower.',
      type: 'admin',
      priority: 'low',
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      action_url: '/command-center/users/demo-user-007',
    },
  ];

  return {
    data: {
      linked_user: true,
      unread_count: 1,
      notifications,
      pagination: { total: 2, page: 1, total_pages: 1, limit: 50 },
    },
    apiAvailable: true,
  };
}

export function getMockMeterVerification() {
  return {
    message: 'Demo meter verified successfully.',
    meterNumber: '45001234567',
    verificationSuccess: true,
    payload: {
      meter_number: '45001234567',
      disco: 'IKEDC',
      vend_type: 'prepaid',
      customer_name: 'Ada Okafor',
      address: '12 Admiralty Way, Lekki, Lagos',
      tariff: 'R2',
      tariff_class: 'Residential',
      min_vend_amount: 500,
      max_vend_amount: 500000,
      outstanding: 0,
      debt_repayment: 0,
      response_code: 0,
      error: false,
    },
    electricityPurchases: [],
    purchaseCount: 0,
  };
}

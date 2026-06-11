import { canAccess } from '@/lib/adminAuth';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';
import type {
  DashboardNewUser,
  DashboardOverview,
  DashboardOverviewParams,
  DashboardRecentTransaction,
} from '@/types/adminDashboard';

const DEMO_TRANSACTIONS: DashboardRecentTransaction[] = [
  {
    id: 'demo-txn-001',
    reference: 'BP-DEMO-88421',
    userId: 'demo-user-001',
    guestUserId: null,
    userName: 'Ada Okafor',
    amount: 12500,
    currency: 'NGN',
    status: 'completed',
    type: 'electricity',
    paymentFor: 'Electricity',
    createdAt: hoursAgo(12),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-002',
    reference: 'BP-DEMO-88420',
    userId: 'demo-user-002',
    guestUserId: null,
    userName: 'Chidi Nwosu',
    amount: 5000,
    currency: 'NGN',
    status: 'completed',
    type: 'airtime',
    paymentFor: 'Airtime',
    createdAt: hoursAgo(28),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-003',
    reference: 'BP-DEMO-88419',
    userId: 'demo-user-003',
    guestUserId: null,
    userName: 'Fatima Bello',
    amount: 25000,
    currency: 'NGN',
    status: 'pending',
    type: 'deposit',
    paymentFor: 'Wallet funding',
    createdAt: hoursAgo(45),
    isInternalTestAccount: true,
  },
  {
    id: 'demo-txn-004',
    reference: 'BP-DEMO-88418',
    userId: 'demo-user-004',
    guestUserId: null,
    userName: 'Emeka Adeyemi',
    amount: 8750,
    currency: 'NGN',
    status: 'completed',
    type: 'data',
    paymentFor: 'Data',
    createdAt: hoursAgo(72),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-005',
    reference: 'BP-DEMO-88417',
    userId: 'demo-user-005',
    guestUserId: null,
    userName: 'Grace Ibrahim',
    amount: 15000,
    currency: 'NGN',
    status: 'completed',
    type: 'cable',
    paymentFor: 'Cable TV',
    createdAt: hoursAgo(96),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-006',
    reference: 'BP-DEMO-88416',
    userId: 'demo-user-006',
    guestUserId: null,
    userName: 'Tunde Bakare',
    amount: 3200,
    currency: 'NGN',
    status: 'failed',
    type: 'electricity',
    paymentFor: 'Electricity',
    createdAt: hoursAgo(120),
    isInternalTestAccount: false,
  },
];

const DEMO_NEW_USERS: DashboardNewUser[] = [
  {
    id: 'demo-user-007',
    firstName: 'Amina',
    lastName: 'Yusuf',
    fullName: 'Amina Yusuf',
    email: 'amina.yusuf@example.com',
    createdAt: hoursAgo(6),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-user-008',
    firstName: 'David',
    lastName: 'Okon',
    fullName: 'David Okon',
    email: 'david.okon@example.com',
    createdAt: hoursAgo(18),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-user-002',
    firstName: 'Chidi',
    lastName: 'Nwosu',
    fullName: 'Chidi Nwosu',
    email: 'chidi.nwosu@example.com',
    createdAt: hoursAgo(36),
    isInternalTestAccount: false,
  },
  {
    id: 'demo-user-003',
    firstName: 'Fatima',
    lastName: 'Bello',
    fullName: 'Fatima Bello',
    email: 'fatima.bello@example.com',
    createdAt: hoursAgo(52),
    isInternalTestAccount: true,
  },
  {
    id: 'demo-user-001',
    firstName: 'Ada',
    lastName: 'Okafor',
    fullName: 'Ada Okafor',
    email: 'ada.okafor@example.com',
    createdAt: hoursAgo(80),
    isInternalTestAccount: false,
  },
];

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function buildMonthKeys(months: number): string[] {
  const keys: string[] = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    );
  }

  return keys;
}

function canViewMoneyStats(admin: AdminProfile | null): boolean {
  return getAdminDemoMode() || canAccess(admin, 'dashboard.money_stats');
}

export function getMockDashboardOverview(
  admin: AdminProfile | null,
  params: DashboardOverviewParams = {}
): DashboardOverview {
  const months = params.months ?? 6;
  const recentLimit = params.recentLimit ?? 5;
  const showMoney = canViewMoneyStats(admin);
  const monthKeys = buildMonthKeys(months);

  const revenueSeries = monthKeys.map((month, index) => ({
    month,
    amount: 4_200_000 + index * 185_000 + (index % 2) * 90_000,
  }));

  const transactionVolume = monthKeys.map((month, index) => ({
    month,
    count: 820 + index * 47 + (index % 3) * 18,
  }));

  const userGrowth = monthKeys.map((month, index) => ({
    month,
    count: 120 + index * 14 + (index % 2) * 9,
  }));

  const recentTransactions = DEMO_TRANSACTIONS.slice(0, recentLimit);
  const newUsers = DEMO_NEW_USERS.slice(0, recentLimit);

  return {
    stats: {
      totalPayments: {
        visible: showMoney,
        amount: 48_750_000,
        currency: 'NGN',
      },
      totalTransactions: 12_486,
      activeUsers: 3_842,
      pendingTransactions: 27,
    },
    recentTransactions,
    newUsers,
    charts: {
      revenueOverview: {
        visible: showMoney,
        series: revenueSeries,
      },
      transactionVolume,
      userGrowth,
    },
    filters: {
      canViewInternalTestUsers: getAdminDemoMode() || canAccess(admin, 'users.list'),
      canViewDeletedUsers: false,
      appliedUserId: params.userId?.trim() ? params.userId.trim() : null,
    },
    generatedAt: new Date().toISOString(),
  };
}

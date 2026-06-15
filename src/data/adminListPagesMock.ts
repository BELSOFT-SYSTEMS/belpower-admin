import { ADMIN_USER_MESSAGING_ENABLED } from '@/constants/adminFeatureFlags';
import { canAccess } from '@/lib/adminAuth';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import type { AdminProfile } from '@/types/adminAuth';
import type {
  ApiTransactionListItem,
  TransactionStatus,
  TransactionType,
  TransactionsListData,
  TransactionsListParams,
  TransactionsListStats,
  TransactionsQuickActions,
} from '@/types/adminTransactions';
import type {
  ApiUser,
  UserDisplayStatus,
  UsersListData,
  UsersListParams,
  UsersQuickActions,
} from '@/types/adminUsers';
import type { WalletOverviewStats } from '@/types/adminWallet';
import { canViewTransactionMoneyStats } from '@/utils/adminTransactionStatsAccess';
import { canViewWalletMoneyStats } from '@/utils/adminWalletAccess';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

export const DEMO_USERS: ApiUser[] = [
  {
    id: 'demo-user-001',
    firstName: 'Ada',
    lastName: 'Okafor',
    fullName: 'Ada Okafor',
    email: 'ada.okafor@example.com',
    status: 'active',
    displayStatus: 'active',
    suspiciousActivity: false,
    isSuspicious: false,
    riskScore: 12,
    suspiciousReasons: [],
    lastActiveAt: hoursAgo(1),
    lastActive: hoursAgo(1),
    lastLoginAt: hoursAgo(2),
    createdAt: daysAgo(120),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
  {
    id: 'demo-user-002',
    firstName: 'Chidi',
    lastName: 'Nwosu',
    fullName: 'Chidi Nwosu',
    email: 'chidi.nwosu@example.com',
    status: 'new',
    displayStatus: 'new',
    suspiciousActivity: false,
    isSuspicious: false,
    riskScore: 4,
    suspiciousReasons: [],
    lastActiveAt: hoursAgo(6),
    lastActive: hoursAgo(6),
    createdAt: daysAgo(2),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
  {
    id: 'demo-user-003',
    firstName: 'Fatima',
    lastName: 'Bello',
    fullName: 'Fatima Bello',
    email: 'fatima.bello@example.com',
    status: 'active',
    displayStatus: 'active',
    suspiciousActivity: true,
    isSuspicious: true,
    riskScore: 78,
    suspiciousReasons: ['velocity'],
    lastActiveAt: hoursAgo(18),
    lastActive: hoursAgo(18),
    createdAt: daysAgo(45),
    deletedAt: null,
    isInternalTestAccount: true,
    avatar: null,
  },
  {
    id: 'demo-user-004',
    firstName: 'Emeka',
    lastName: 'Adeyemi',
    fullName: 'Emeka Adeyemi',
    email: 'emeka.adeyemi@example.com',
    status: 'dormant',
    displayStatus: 'dormant',
    suspiciousActivity: false,
    isSuspicious: false,
    riskScore: 20,
    suspiciousReasons: [],
    lastActiveAt: daysAgo(62),
    lastActive: daysAgo(62),
    createdAt: daysAgo(200),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
  {
    id: 'demo-user-005',
    firstName: 'Grace',
    lastName: 'Ibrahim',
    fullName: 'Grace Ibrahim',
    email: 'grace.ibrahim@example.com',
    status: 'blocked',
    displayStatus: 'blocked',
    suspiciousActivity: true,
    isSuspicious: true,
    riskScore: 91,
    suspiciousReasons: ['duplicate_recipient'],
    lastActiveAt: daysAgo(5),
    lastActive: daysAgo(5),
    createdAt: daysAgo(90),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
  {
    id: 'demo-user-006',
    firstName: 'Tunde',
    lastName: 'Bakare',
    fullName: 'Tunde Bakare',
    email: 'tunde.bakare@example.com',
    status: 'suspended',
    displayStatus: 'suspended',
    suspiciousActivity: false,
    isSuspicious: false,
    riskScore: 35,
    suspiciousReasons: [],
    lastActiveAt: daysAgo(12),
    lastActive: daysAgo(12),
    createdAt: daysAgo(150),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
  {
    id: 'demo-user-007',
    firstName: 'Amina',
    lastName: 'Yusuf',
    fullName: 'Amina Yusuf',
    email: 'amina.yusuf@example.com',
    status: 'active',
    displayStatus: 'active',
    suspiciousActivity: false,
    isSuspicious: false,
    riskScore: 8,
    suspiciousReasons: [],
    lastActiveAt: hoursAgo(3),
    lastActive: hoursAgo(3),
    createdAt: daysAgo(14),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
  {
    id: 'demo-user-008',
    firstName: 'David',
    lastName: 'Okon',
    fullName: 'David Okon',
    email: 'david.okon@example.com',
    status: 'active',
    displayStatus: 'active',
    suspiciousActivity: false,
    isSuspicious: false,
    riskScore: 15,
    suspiciousReasons: [],
    lastActiveAt: hoursAgo(10),
    lastActive: hoursAgo(10),
    createdAt: daysAgo(30),
    deletedAt: null,
    isInternalTestAccount: false,
    avatar: null,
  },
];

export const DEMO_TRANSACTIONS: ApiTransactionListItem[] = [
  {
    id: 'demo-txn-001',
    reference: 'BP-DEMO-88421',
    userId: 'demo-user-001',
    userName: 'Ada Okafor',
    type: 'electricity',
    service: 'electricity',
    provider: 'ikedc',
    amount: 12000,
    totalAmount: 12840,
    serviceCharge: 100,
    vat: 740,
    status: 'completed',
    createdAt: hoursAgo(4),
    completedAt: hoursAgo(4),
    isScheduled: false,
    isSuspicious: false,
    isBlocked: false,
    paymentMethod: 'Wallet',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-002',
    reference: 'BP-DEMO-88420',
    userId: 'demo-user-002',
    userName: 'Chidi Nwosu',
    type: 'airtime',
    service: 'airtime',
    provider: 'mtn',
    amount: 5000,
    totalAmount: 5050,
    serviceCharge: 50,
    vat: 0,
    status: 'completed',
    createdAt: hoursAgo(9),
    completedAt: hoursAgo(9),
    isScheduled: false,
    isSuspicious: false,
    isBlocked: false,
    paymentMethod: 'Card',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-003',
    reference: 'BP-DEMO-88419',
    userId: 'demo-user-003',
    userName: 'Fatima Bello',
    type: 'deposit',
    service: 'deposit',
    provider: 'wallet',
    amount: 25000,
    totalAmount: 25000,
    serviceCharge: 0,
    vat: 0,
    status: 'pending',
    createdAt: hoursAgo(14),
    completedAt: null,
    isScheduled: false,
    isSuspicious: true,
    isBlocked: false,
    fraudReason: 'Multiple rapid top-ups',
    paymentMethod: 'Bank transfer',
    isInternalTestAccount: true,
  },
  {
    id: 'demo-txn-004',
    reference: 'BP-DEMO-88418',
    userId: 'demo-user-004',
    userName: 'Emeka Adeyemi',
    type: 'data',
    service: 'data',
    provider: 'airtel',
    amount: 8750,
    totalAmount: 8850,
    serviceCharge: 100,
    vat: 0,
    status: 'completed',
    createdAt: hoursAgo(22),
    completedAt: hoursAgo(22),
    isScheduled: false,
    isSuspicious: false,
    isBlocked: false,
    paymentMethod: 'Wallet',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-005',
    reference: 'BP-DEMO-88417',
    userId: 'demo-user-005',
    userName: 'Grace Ibrahim',
    type: 'cable',
    service: 'cable',
    provider: 'dstv',
    amount: 15000,
    totalAmount: 15200,
    serviceCharge: 200,
    vat: 0,
    status: 'failed',
    createdAt: hoursAgo(30),
    completedAt: null,
    isScheduled: false,
    isSuspicious: true,
    isBlocked: true,
    fraudReason: 'Unusual amount vs. user history',
    paymentMethod: 'Card',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-006',
    reference: 'BP-DEMO-88416',
    userId: 'demo-user-006',
    userName: 'Tunde Bakare',
    type: 'electricity',
    service: 'electricity',
    provider: 'aedc',
    amount: 18000,
    totalAmount: 18660,
    serviceCharge: 180,
    vat: 480,
    status: 'scheduled',
    createdAt: daysAgo(2),
    completedAt: null,
    isScheduled: true,
    scheduledInfo: { frequency: 'monthly', nextPurchaseAt: daysAgo(-28) },
    isSuspicious: false,
    isBlocked: false,
    paymentMethod: 'Wallet',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-007',
    reference: 'BP-DEMO-88415',
    userId: 'demo-user-007',
    userName: 'Amina Yusuf',
    type: 'deposit',
    service: 'deposit',
    provider: 'wallet',
    amount: 10000,
    totalAmount: 10000,
    serviceCharge: 0,
    vat: 0,
    status: 'completed',
    createdAt: hoursAgo(48),
    completedAt: hoursAgo(48),
    isScheduled: false,
    isSuspicious: false,
    isBlocked: false,
    paymentMethod: 'Card',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-008',
    reference: 'BP-DEMO-88414',
    userId: 'demo-user-008',
    userName: 'David Okon',
    type: 'airtime',
    service: 'airtime',
    provider: 'glo',
    amount: 2000,
    totalAmount: 2050,
    serviceCharge: 50,
    vat: 0,
    status: 'completed',
    createdAt: hoursAgo(56),
    completedAt: hoursAgo(56),
    isScheduled: false,
    isSuspicious: false,
    isBlocked: false,
    paymentMethod: 'Wallet',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-009',
    reference: 'BP-DEMO-88413',
    userId: 'demo-user-001',
    userName: 'Ada Okafor',
    type: 'refund',
    service: 'refund',
    provider: 'wallet',
    amount: 3500,
    totalAmount: 3500,
    serviceCharge: 0,
    vat: 0,
    status: 'completed',
    createdAt: daysAgo(3),
    completedAt: daysAgo(3),
    isScheduled: false,
    isSuspicious: false,
    isBlocked: false,
    isRefund: true,
    paymentMethod: 'Wallet',
    isInternalTestAccount: false,
  },
  {
    id: 'demo-txn-010',
    reference: 'BP-DEMO-88412',
    userId: 'demo-user-003',
    userName: 'Fatima Bello',
    type: 'cable',
    service: 'cable',
    provider: 'gotv',
    amount: 6500,
    totalAmount: 6650,
    serviceCharge: 150,
    vat: 0,
    status: 'pending',
    createdAt: hoursAgo(72),
    completedAt: null,
    isScheduled: false,
    isSuspicious: true,
    isBlocked: false,
    paymentMethod: 'Wallet',
    isInternalTestAccount: true,
  },
];

function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

function matchesSearch(haystack: string, search: string): boolean {
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

function getUsersQuickActions(admin: AdminProfile | null): UsersQuickActions {
  if (getAdminDemoMode()) {
    return {
      block: true,
      suspend: true,
      activate: true,
      message: ADMIN_USER_MESSAGING_ENABLED,
    };
  }

  return {
    block: canAccess(admin, 'users.block'),
    suspend: canAccess(admin, 'users.suspend'),
    activate: canAccess(admin, 'users.activate'),
    message: ADMIN_USER_MESSAGING_ENABLED && canAccess(admin, 'users.list'),
  };
}

function getTransactionsQuickActions(admin: AdminProfile | null): TransactionsQuickActions {
  if (getAdminDemoMode()) {
    return {
      review: true,
      block: true,
      unblock: true,
      clearReview: true,
      requery: true,
    };
  }

  return {
    review: canAccess(admin, 'transactions.review'),
    block: canAccess(admin, 'transactions.block'),
    unblock: canAccess(admin, 'transactions.block'),
    clearReview: canAccess(admin, 'transactions.block'),
    requery: canAccess(admin, 'transactions.requery'),
  };
}

function filterUsers(users: ApiUser[], params: UsersListParams): ApiUser[] {
  let filtered = [...users];

  if (params.search?.trim()) {
    const search = params.search.trim();
    filtered = filtered.filter(
      (user) =>
        matchesSearch(user.fullName, search) ||
        matchesSearch(user.email, search) ||
        matchesSearch(user.id, search)
    );
  }

  if (params.suspicious) {
    filtered = filtered.filter((user) => user.suspiciousActivity);
  }

  if (params.hasWalletBalance) {
    filtered = filtered.filter((user) => user.displayStatus === 'active');
  }

  if (params.status) {
    filtered = filtered.filter((user) => user.displayStatus === params.status);
  }

  return filtered;
}

function filterTransactions(
  transactions: ApiTransactionListItem[],
  params: TransactionsListParams
): ApiTransactionListItem[] {
  let filtered = [...transactions];

  if (params.search?.trim()) {
    const search = params.search.trim();
    filtered = filtered.filter(
      (tx) =>
        matchesSearch(tx.reference, search) ||
        matchesSearch(tx.userName, search) ||
        matchesSearch(tx.id, search) ||
        matchesSearch(tx.provider, search)
    );
  }

  if (params.userId?.trim()) {
    const userId = params.userId.trim();
    filtered = filtered.filter((tx) => tx.userId === userId);
  }

  if (params.type) {
    filtered = filtered.filter((tx) => tx.type === params.type);
  } else if (params.paymentMethod === 'wallet') {
    filtered = filtered.filter(
      (tx) => tx.type !== 'deposit' && tx.paymentMethod?.toLowerCase() === 'wallet'
    );
  } else if (params.walletActivity) {
    filtered = filtered.filter(
      (tx) => tx.type === 'deposit' || tx.paymentMethod?.toLowerCase() === 'wallet'
    );
  }

  if (params.flagged) {
    filtered = filtered.filter((tx) => tx.isSuspicious);
  }

  if (params.status) {
    filtered = filtered.filter((tx) => tx.status === params.status);
  }

  return filtered;
}

function buildTransactionStats(
  transactions: ApiTransactionListItem[],
  canViewMoney: boolean
): TransactionsListStats {
  const completed = transactions.filter((tx) => tx.status === 'completed');
  const pending = transactions.filter((tx) => tx.status === 'pending');
  const refunds = transactions.filter((tx) => tx.isRefund || tx.type === 'refund');
  const scheduled = transactions.filter((tx) => tx.isScheduled || tx.status === 'scheduled');
  const flagged = transactions.filter((tx) => tx.isSuspicious);

  const sum = (items: ApiTransactionListItem[]) =>
    items.reduce((total, tx) => total + tx.totalAmount, 0);

  const countStat = (count: number, definition: string) => ({ count, definition });

  const stats: TransactionsListStats = {
    totalTransactions: countStat(transactions.length, 'All transactions in scope'),
    completedTransactions: countStat(completed.length, 'Completed transactions'),
    pendingTransactions: countStat(pending.length, 'Pending transactions'),
    refundTransactions: countStat(refunds.length, 'Refund transactions'),
    scheduled: countStat(scheduled.length, 'Scheduled transactions'),
    flagged: countStat(flagged.length, 'Flagged transactions'),
  };

  if (canViewMoney) {
    stats.totalVolume = {
      amount: sum(transactions),
      currency: 'NGN',
      definition: 'Total transaction volume',
    };
    stats.completed = {
      amount: sum(completed),
      count: completed.length,
      definition: 'Completed volume',
    };
    stats.pending = {
      amount: sum(pending),
      count: pending.length,
      definition: 'Pending volume',
    };
    stats.refunds = {
      amount: sum(refunds),
      count: refunds.length,
      definition: 'Refund volume',
    };
  }

  return stats;
}

export function getMockUsersList(
  admin: AdminProfile | null,
  params: UsersListParams = {}
): UsersListData {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const filtered = filterUsers(DEMO_USERS, params);
  const { items, pagination } = paginate(filtered, page, limit);
  const canViewInternalTestUsers = getAdminDemoMode() || canAccess(admin, 'users.list');
  const visibleUsers =
    canViewInternalTestUsers ? items : items.filter((user) => !user.isInternalTestAccount);

  return {
    stats: params.includeStats
      ? {
          totalUsers: { count: 3842, definition: 'All registered users' },
          newUsers: { count: 128, period: '7d', definition: 'Joined in the last 7 days' },
          activeUsers: { count: 2910, definition: 'Active in the last 30 days' },
          flaggedUsers: { count: 14, definition: 'Users with suspicion flags' },
        }
      : null,
    quickActions: getUsersQuickActions(admin),
    users: visibleUsers,
    pagination,
    filters: {
      statuses: [
        'active',
        'new',
        'dormant',
        'blocked',
        'suspended',
        'inactive',
      ] as UserDisplayStatus[],
      canViewDeletedUsers: false,
      canViewInternalTestUsers: canViewInternalTestUsers,
      appliedStatus: params.status ?? null,
      includeDeleted: false,
      appliedHasWalletBalance: params.hasWalletBalance ?? false,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getMockTransactionsList(
  admin: AdminProfile | null,
  params: TransactionsListParams = {}
): TransactionsListData {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const filtered = filterTransactions(DEMO_TRANSACTIONS, params);
  const { items, pagination } = paginate(filtered, page, limit);
  const canViewMoney = getAdminDemoMode() || canViewTransactionMoneyStats(admin);
  const canViewInternalTest = getAdminDemoMode() || canAccess(admin, 'users.list');
  const visibleTransactions =
    canViewInternalTest ? items : items.filter((tx) => !tx.isInternalTestAccount);

  const filters = {
    types: [
      'electricity',
      'airtime',
      'data',
      'cable',
      'deposit',
      'refund',
      'cashback',
    ] as TransactionType[],
    statuses: ['completed', 'pending', 'failed', 'scheduled', 'flagged'] as Array<
      TransactionStatus | 'flagged' | 'scheduled'
    >,
    canViewInternalTestTransactions: canViewInternalTest,
    canViewMoneyStats: canViewMoney,
    appliedType: params.type ?? null,
    appliedStatus: params.status ?? null,
    appliedFlagged: Boolean(params.flagged),
    appliedUserId: params.userId?.trim() ? params.userId.trim() : null,
  };

  return {
    stats: params.includeStats
      ? buildTransactionStats(filtered, canViewMoney)
      : null,
    quickActions: getTransactionsQuickActions(admin),
    transactions: visibleTransactions,
    pagination,
    filters,
    generatedAt: new Date().toISOString(),
  };
}

export function getMockWalletOverview(admin: AdminProfile | null): WalletOverviewStats {
  const canViewMoney = getAdminDemoMode() || canViewWalletMoneyStats(admin);

  return {
    totalUserBalance: {
      amount: canViewMoney ? 128_450_000 : null,
      currency: 'NGN',
      canView: canViewMoney,
    },
    buyPowerBalance: {
      amount: canViewMoney ? 48_750_000 : null,
      currency: 'NGN',
      canView: canViewMoney,
      lastUpdated: new Date().toISOString(),
    },
    profit: {
      amount: canViewMoney ? 12_680_500 : null,
      currency: 'NGN',
      canView: canViewMoney,
      definition: 'completed_service_charges',
    },
    fundingCount: { count: 1842 },
    debitCount: { count: 6210 },
    flaggedCount: { count: 6 },
  };
}

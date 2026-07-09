/**
 * Mock data shaped for future API integration (GET /users/all, user detail, transactions)
 */

import type { TransactionReviewStatus } from '@/types/adminTransactions';

export type UserListItem = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'dormant' | 'blocked' | 'new';
  last_active: string;
  suspicious_activity: boolean;
  avatar: string;
};

export type AdminTransaction = {
  id: string;
  reference: string;
  user_id: string;
  user_name: string;
  type: 'electricity' | 'airtime' | 'data' | 'cable' | 'betting' | 'deposit' | 'refund' | 'cashback';
  service: string;
  provider: string;
  amount: number;
  amount_purchased?: number | null;
  total_amount: number;
  service_charge: number;
  vat: number;
  status: 'completed' | 'pending' | 'failed' | 'scheduled';
  created_at: string;
  completed_at: string | null;
  is_scheduled?: boolean;
  scheduled_info?: {
    frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | string;
    next_purchase: string;
  };
  suspicious: boolean;
  is_blocked?: boolean;
  review_status?: TransactionReviewStatus | null;
  can_clear_review?: boolean;
  fraud_reason?: string;
  avatar: string;
  // Service-specific (mock)
  meter_number?: string;
  token?: string;
  units?: number;
  phone_number?: string;
  smartcard_number?: string;
  package_name?: string;
  data_bundle?: string;
  customer_name?: string;
  address?: string;
  payment_method?: string;
  order_id?: string;
  requery_recommended?: boolean;
  requery_reason?: string | null;
  is_refund?: boolean;
  is_cashback?: boolean;
  original_transaction_id?: string | null;
  refund_reason?: string | null;
  cashback_source_type?: string | null;
  cashback_rate?: string | null;
  cashback_description?: string | null;
};

export type UserSession = {
  id: string;
  device: string;
  ip: string;
  location: string;
  last_active: string;
  current: boolean;
};

export type UserLog = {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  ip: string;
};

export type MeterType = 'prepaid' | 'postpaid';

export type SavedMeter = {
  id: string;
  meter_number: string;
  disco: string;
  customer_name: string;
  address: string;
  meter_type: MeterType;
  is_primary: boolean;
  is_verified: boolean;
};

export type UserSecurityInfo = {
  risk_level: 'low' | 'medium' | 'high';
  failed_login_attempts: number;
  two_factor_enabled: boolean;
  last_password_change: string;
  review_status: 'cleared' | 'under_review' | 'escalated';
  last_reviewed_at: string;
};

export type UserDetail = UserListItem & {
  phone: string;
  joined_at: string;
  last_login: string;
  email_verified: boolean;
  phone_verified: boolean;
  suspicious_user: boolean;
  security: UserSecurityInfo;
  wallet_balance: number;
  highest_transaction_amount: number;
  last_transaction_amount: number;
  last_transaction_at: string;
  total_spent: number;
  transaction_count: number;
  primary_meter: SavedMeter;
  saved_meters: SavedMeter[];
  sessions: UserSession[];
  logs: UserLog[];
  transactions: AdminTransaction[];
};

export const MOCK_USERS_LIST: UserListItem[] = [
  {
    id: 'john-travis',
    first_name: 'John',
    last_name: 'Travis',
    email: 'johntravis@gmail.com',
    status: 'active',
    last_active: '2 mins ago',
    suspicious_activity: false,
    avatar: '/Profile.png',
  },
  {
    id: 'debbie-sam',
    first_name: 'Debbie',
    last_name: 'Sam',
    email: 'debbiesam@gmail.com',
    status: 'new',
    last_active: 'Just joined',
    suspicious_activity: false,
    avatar: '/Profile.png',
  },
  {
    id: 'michael-essien',
    first_name: 'Michael',
    last_name: 'Essien',
    email: 'mikeessien@gmail.com',
    status: 'dormant',
    last_active: '2 months ago',
    suspicious_activity: true,
    avatar: '/Profile.png',
  },
  {
    id: 'anita-bose',
    first_name: 'Anita',
    last_name: 'Bose',
    email: 'anitabose@gmail.com',
    status: 'active',
    last_active: '1 hour ago',
    suspicious_activity: false,
    avatar: '/Profile.png',
  },
  {
    id: 'chris-paul',
    first_name: 'Chris',
    last_name: 'Paul',
    email: 'chrispaul@gmail.com',
    status: 'blocked',
    last_active: '3 days ago',
    suspicious_activity: true,
    avatar: '/Profile.png',
  },
];

const baseTransactions: AdminTransaction[] = [
  {
    id: 'TRX-789456',
    reference: 'TRX-789456',
    user_id: 'john-travis',
    user_name: 'John Travis',
    type: 'electricity',
    service: 'electricity',
    provider: 'ikedc',
    amount: 5000,
    total_amount: 5350,
    service_charge: 100,
    vat: 250,
    status: 'completed',
    created_at: '2025-06-03T09:12:00Z',
    completed_at: '2025-06-03T09:12:45Z',
    suspicious: false,
    avatar: '/Profile.png',
    meter_number: '12345678901',
    token: '1234-5678-9012-3456',
    units: 45.67,
    customer_name: 'John Travis',
    address: '12 Admiralty Way, Lekki, Lagos',
    payment_method: 'Wallet',
    order_id: 'ORD-882910',
  },
  {
    id: 'TRX-789457',
    reference: 'TRX-789457',
    user_id: 'debbie-sam',
    user_name: 'Debbie Sam',
    type: 'data',
    service: 'data',
    provider: 'mtn',
    amount: 5000,
    total_amount: 5100,
    service_charge: 100,
    vat: 0,
    status: 'pending',
    created_at: '2025-06-03T08:45:00Z',
    completed_at: null,
    suspicious: false,
    avatar: '/Profile.png',
    phone_number: '08023456789',
    data_bundle: '10GB — 30 days',
    payment_method: 'Card',
    order_id: 'ORD-882911',
  },
  {
    id: 'TRX-789458',
    reference: 'TRX-789458',
    user_id: 'john-travis',
    user_name: 'John Travis',
    type: 'airtime',
    service: 'airtime',
    provider: 'airtel',
    amount: 2000,
    total_amount: 2050,
    service_charge: 50,
    vat: 0,
    status: 'completed',
    created_at: '2025-06-01T11:00:00Z',
    completed_at: '2025-06-01T11:00:12Z',
    suspicious: false,
    avatar: '/Profile.png',
    phone_number: '08012345678',
    payment_method: 'Wallet',
  },
  {
    id: 'TRX-789459',
    reference: 'TRX-789459',
    user_id: 'michael-essien',
    user_name: 'Michael Essien',
    type: 'cable',
    service: 'cable',
    provider: 'dstv',
    amount: 15000,
    total_amount: 15200,
    service_charge: 200,
    vat: 0,
    status: 'completed',
    created_at: '2025-05-28T14:00:00Z',
    completed_at: '2025-05-28T14:01:00Z',
    suspicious: true,
    fraud_reason: 'Unusual amount vs. user history',
    avatar: '/Profile.png',
    smartcard_number: '4028123456',
    package_name: 'DStv Compact Plus',
    customer_name: 'Michael Essien',
    payment_method: 'Card',
  },
  {
    id: 'TRX-789460',
    reference: 'TRX-789460',
    user_id: 'chris-paul',
    user_name: 'Chris Paul',
    type: 'deposit',
    service: 'deposit',
    provider: 'wallet',
    amount: 50000,
    total_amount: 50000,
    service_charge: 0,
    vat: 0,
    status: 'completed',
    created_at: '2025-05-20T10:00:00Z',
    completed_at: '2025-05-20T10:05:00Z',
    suspicious: true,
    is_blocked: true,
    fraud_reason: 'Multiple rapid top-ups from new device',
    avatar: '/Profile.png',
    payment_method: 'Bank transfer',
  },
  {
    id: 'TRX-789461',
    reference: 'TRX-789461',
    user_id: 'anita-bose',
    user_name: 'Anita Bose',
    type: 'electricity',
    service: 'electricity',
    provider: 'aedc',
    amount: 12000,
    total_amount: 12480,
    service_charge: 180,
    vat: 300,
    status: 'failed',
    created_at: '2025-05-15T16:30:00Z',
    completed_at: null,
    suspicious: false,
    avatar: '/Profile.png',
    meter_number: '55667788901',
    customer_name: 'Anita Bose',
    address: 'Wuse Zone 4, Abuja',
    payment_method: 'Wallet',
  },
  {
    id: 'TRX-789462',
    reference: 'TRX-789462',
    user_id: 'john-travis',
    user_name: 'John Travis',
    type: 'electricity',
    service: 'electricity',
    provider: 'ikedc',
    amount: 8000,
    total_amount: 8560,
    service_charge: 100,
    vat: 460,
    status: 'scheduled',
    created_at: '2025-06-01T10:00:00Z',
    completed_at: null,
    is_scheduled: true,
    scheduled_info: {
      frequency: 'monthly',
      next_purchase: '2025-07-01T08:00:00Z',
    },
    suspicious: false,
    avatar: '/Profile.png',
    meter_number: '12345678901',
    customer_name: 'John Travis',
    address: '12 Admiralty Way, Lekki, Lagos',
    payment_method: 'Wallet',
    order_id: 'ORD-882920',
  },
  {
    id: 'TRX-789463',
    reference: 'TRX-789463',
    user_id: 'debbie-sam',
    user_name: 'Debbie Sam',
    type: 'airtime',
    service: 'airtime',
    provider: 'mtn',
    amount: 3000,
    total_amount: 3050,
    service_charge: 50,
    vat: 0,
    status: 'scheduled',
    created_at: '2025-05-25T12:00:00Z',
    completed_at: null,
    is_scheduled: true,
    scheduled_info: {
      frequency: 'weekly',
      next_purchase: '2025-06-10T06:00:00Z',
    },
    suspicious: false,
    avatar: '/Profile.png',
    phone_number: '08023456789',
    payment_method: 'Wallet',
    order_id: 'ORD-882921',
  },
  {
    id: 'TRX-789464',
    reference: 'TRX-789464',
    user_id: 'anita-bose',
    user_name: 'Anita Bose',
    type: 'cable',
    service: 'cable',
    provider: 'gotv',
    amount: 6500,
    total_amount: 6650,
    service_charge: 150,
    vat: 0,
    status: 'scheduled',
    created_at: '2025-05-18T09:30:00Z',
    completed_at: null,
    is_scheduled: true,
    scheduled_info: {
      frequency: 'monthly',
      next_purchase: '2025-06-18T09:00:00Z',
    },
    suspicious: false,
    avatar: '/Profile.png',
    smartcard_number: '7012345678',
    package_name: 'GOtv Max',
    customer_name: 'Anita Bose',
    payment_method: 'Wallet',
    order_id: 'ORD-882922',
  },
];

export const MOCK_TRANSACTIONS: AdminTransaction[] = baseTransactions;

/** Platform BuyPower wallet float (mock until API) */
export const BUYPOWER_WALLET_BALANCE = 48_250_000;

export function isWalletTransaction(tx: AdminTransaction): boolean {
  if (tx.type === 'deposit') return true;
  return tx.payment_method?.toLowerCase() === 'wallet';
}

export function getWalletTransactions(): AdminTransaction[] {
  return [...MOCK_TRANSACTIONS]
    .filter(isWalletTransaction)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export function getTransactionById(id: string): AdminTransaction | undefined {
  const normalized = id.replace(/^#/, '').toUpperCase();
  return MOCK_TRANSACTIONS.find(
    (t) => t.id.toUpperCase() === normalized || t.reference.toUpperCase() === normalized
  );
}

function buildUserSecurity(
  base: UserListItem,
  suspiciousTxnCount: number
): UserSecurityInfo {
  if (base.suspicious_activity) {
    return {
      risk_level: suspiciousTxnCount > 0 ? 'high' : 'medium',
      failed_login_attempts: base.id === 'chris-paul' ? 5 : 3,
      two_factor_enabled: false,
      last_password_change: 'Mar 2, 2025',
      review_status: base.id === 'chris-paul' ? 'escalated' : 'under_review',
      last_reviewed_at: 'Jun 1, 2025 — Fraud team',
    };
  }
  if (suspiciousTxnCount > 0) {
    return {
      risk_level: 'medium',
      failed_login_attempts: 1,
      two_factor_enabled: true,
      last_password_change: 'Apr 18, 2025',
      review_status: 'under_review',
      last_reviewed_at: 'May 30, 2025 — Auto rules',
    };
  }
  return {
    risk_level: 'low',
    failed_login_attempts: 0,
    two_factor_enabled: base.status === 'active',
    last_password_change:
      base.id === 'john-travis' ? 'May 12, 2025' : 'Feb 8, 2025',
    review_status: 'cleared',
    last_reviewed_at: 'Jun 3, 2025 — System',
  };
}

function buildUserDetail(base: UserListItem): UserDetail {
  const userTxns = MOCK_TRANSACTIONS.filter((t) => t.user_id === base.id);
  const lastTxn = userTxns[0];
  const highest = Math.max(...userTxns.map((t) => t.total_amount), 0);
  const suspiciousTxnCount = userTxns.filter((t) => t.suspicious).length;

  return {
    ...base,
    phone: '+234 801 234 5678',
    joined_at: 'Jan 10, 2024',
    last_login: 'Jun 3, 2025 — 09:00 WAT',
    email_verified: true,
    phone_verified: base.id !== 'michael-essien',
    suspicious_user: base.suspicious_activity,
    security: buildUserSecurity(base, suspiciousTxnCount),
    wallet_balance: base.id === 'john-travis' ? 78500 : base.id === 'debbie-sam' ? 12000 : 45000,
    highest_transaction_amount: highest || 0,
    last_transaction_amount: lastTxn?.total_amount ?? 0,
    last_transaction_at: lastTxn?.created_at ?? '—',
    total_spent: userTxns.reduce((s, t) => s + t.total_amount, 0),
    transaction_count: userTxns.length,
    primary_meter: {
      id: 'm1',
      meter_number: '12345678901',
      disco: 'IKEDC',
      customer_name: `${base.first_name} ${base.last_name}`,
      address:
        base.id === 'john-travis'
          ? '12 Admiralty Way, Lekki, Lagos'
          : base.id === 'debbie-sam'
            ? '8 GRA Phase 2, Port Harcourt'
            : '22 Wuse Zone 4, Abuja',
      meter_type: 'prepaid',
      is_primary: true,
      is_verified: base.status !== 'blocked',
    },
    saved_meters: [
      {
        id: 'm1',
        meter_number: '12345678901',
        disco: 'IKEDC',
        customer_name: `${base.first_name} ${base.last_name}`,
        address:
          base.id === 'john-travis'
            ? '12 Admiralty Way, Lekki, Lagos'
            : '8 GRA Phase 2, Port Harcourt',
        meter_type: 'prepaid',
        is_primary: true,
        is_verified: true,
      },
      {
        id: 'm2',
        meter_number: '98765432109',
        disco: 'EKEDC',
        customer_name: `${base.first_name} ${base.last_name}`,
        address: '14 Victoria Island, Lagos',
        meter_type: 'postpaid',
        is_primary: false,
        is_verified: base.status === 'active',
      },
    ],
    sessions: [
      {
        id: 's1',
        device: 'iPhone 15 — Safari',
        ip: '102.89.xx.xx',
        location: 'Lagos, NG',
        last_active: '2 mins ago',
        current: true,
      },
      {
        id: 's2',
        device: 'Chrome — Windows',
        ip: '197.210.xx.xx',
        location: 'Lagos, NG',
        last_active: 'Jun 1, 2025',
        current: false,
      },
    ],
    logs: [
      {
        id: 'l1',
        action: 'Login',
        detail: 'Successful login via mobile app',
        timestamp: 'Jun 3, 2025 09:00',
        ip: '102.89.xx.xx',
      },
      {
        id: 'l2',
        action: 'Transaction',
        detail: lastTxn ? `Completed ${lastTxn.service} — ${lastTxn.reference}` : 'No transactions',
        timestamp: 'Jun 3, 2025 09:12',
        ip: '102.89.xx.xx',
      },
      {
        id: 'l3',
        action: 'Profile update',
        detail: 'Phone number verified',
        timestamp: 'May 20, 2025 14:22',
        ip: '197.210.xx.xx',
      },
    ],
    transactions: userTxns,
  };
}

const userDetailsCache: Record<string, UserDetail> = {};

export function getUserDetail(userId: string): UserDetail | undefined {
  if (userDetailsCache[userId]) return userDetailsCache[userId];
  const base = MOCK_USERS_LIST.find((u) => u.id === userId);
  if (!base) return undefined;
  userDetailsCache[userId] = buildUserDetail(base);
  return userDetailsCache[userId];
}

function formatCashbackSourceLabel(source?: string | null): string {
  if (!source) return '';
  const key = source.toLowerCase();
  if (key === 'airtime') return 'Airtime';
  if (key === 'data') return 'Data';
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function getTransactionTitle(txn: AdminTransaction): string {
  if (txn.is_refund || txn.type === 'refund') return 'Wallet refund';
  if (txn.is_cashback || txn.type === 'cashback') {
    const source = formatCashbackSourceLabel(txn.cashback_source_type);
    return source ? `Cashback — ${source}` : 'Cashback';
  }
  if (txn.type === 'deposit') return 'Wallet funding';
  if (txn.type === 'electricity') return `Electricity — ${getProviderDisplay(txn.provider)}`;
  if (txn.type === 'cable') return `Cable — ${txn.package_name || getProviderDisplay(txn.provider)}`;
  if (txn.type === 'data') return `Data — ${txn.data_bundle || getProviderDisplay(txn.provider)}`;
  if (txn.type === 'airtime') return `Airtime — ${getProviderDisplay(txn.provider)}`;
  return txn.service;
}

function getProviderDisplay(provider: string): string {
  const map: Record<string, string> = {
    ikedc: 'IKEDC',
    mtn: 'MTN',
    airtel: 'Airtel',
    dstv: 'DStv',
    aedc: 'AEDC',
    wallet: 'Wallet',
  };
  return map[provider.toLowerCase()] ?? provider.toUpperCase();
}

import type { UserDisplayStatus } from '@/types/adminUsers';

import type { FraudEvent } from '@/types/adminFraud';

export type UserDetailQuickActions = {
  block: boolean;
  suspend: boolean;
  activate: boolean;
  message: boolean;
  clearSuspicion: boolean;
  delete: boolean;
};

export type UserMeterType = 'prepaid' | 'postpaid';

export type UserRiskLevel = 'low' | 'medium' | 'high';

export type UserReviewStatus = 'cleared' | 'under_review';

export type UserTransactionType =
  | 'electricity'
  | 'airtime'
  | 'data'
  | 'cable'
  | 'deposit'
  | 'refund'
  | 'cashback';

export type UserTransactionStatus = 'completed' | 'pending' | 'failed' | 'scheduled';

export type AdminMeter = {
  id: string;
  meterNumber: string;
  disco: string;
  customerName: string;
  address: string;
  meterType: UserMeterType;
  isPrimary: boolean;
  isVerified: boolean;
};

export type AdminUserSession = {
  id: string;
  device: string;
  ip: string;
  location: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
};

export type AdminUserLog = {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  ip: string | null;
};

export type AdminUserSecurity = {
  riskLevel: UserRiskLevel;
  failedLoginAttempts: number;
  twoFactorEnabled: boolean;
  lastPasswordChangeAt: string | null;
  reviewStatus: UserReviewStatus;
  lastReviewedAt: string | null;
  lastReviewedBy: string | null;
  suspiciousTransactionCount?: number;
  latestIp?: string | null;
  latestIpScore?: number | null;
  maxIpScore?: number | null;
};

export type AdminUserTransactionScheduledInfo = {
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | string;
  nextPurchaseAt: string;
};

export type AdminUserTransaction = {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  type: UserTransactionType;
  service: string;
  provider: string;
  amount: number;
  amountPurchased?: number | null;
  totalAmount: number;
  serviceCharge: number;
  vat: number;
  status: UserTransactionStatus;
  createdAt: string;
  completedAt: string | null;
  isScheduled?: boolean;
  scheduledInfo?: AdminUserTransactionScheduledInfo;
  isSuspicious: boolean;
  isBlocked?: boolean;
  fraudReason?: string | null;
  requeryRecommended?: boolean;
  requeryReason?: string | null;
  paymentMethod?: string | null;
  orderId?: string | null;
  meterNumber?: string | null;
  token?: string | null;
  units?: number | null;
  phoneNumber?: string | null;
  smartcardNumber?: string | null;
  packageName?: string | null;
  dataBundle?: string | null;
  customerName?: string | null;
  address?: string | null;
  isRefund?: boolean;
  isCashback?: boolean;
  originalTransactionId?: string | null;
  refundReason?: string | null;
  cashbackSourceType?: string | null;
  cashbackRate?: string | null;
  cashbackDescription?: string | null;
};

export type AdminUserDetailStats = {
  walletBalance: number;
  highestTransactionAmount: number | null;
  lastTransactionAmount: number | null;
  totalSpent: number;
  transactionCount: number;
};

export type AdminUserDetail = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  displayStatus: UserDisplayStatus;
  avatar: null;

  isSuspicious: boolean;
  suspiciousActivity: boolean;
  suspiciousReasons: string[];
  riskScore: number;
  suspiciousTransactionCount: number;
  isInternalTestAccount: boolean;
  deletedAt: string | null;

  createdAt: string;
  joinedAt: string;
  lastActiveAt: string | null;
  lastActive?: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;

  stats: AdminUserDetailStats;
  quickActions: UserDetailQuickActions;

  primaryMeter: AdminMeter | null;
  savedMeters: AdminMeter[];

  sessions: AdminUserSession[];
  logs: AdminUserLog[];
  transactions: AdminUserTransaction[];

  security: AdminUserSecurity;

  fraudEvents: FraudEvent[];
  fraudEventCount: number;

  generatedAt: string;
};

export type ClearUserSuspicionResult = {
  userId: string;
  suspiciousActivity: boolean;
  isSuspicious: boolean;
  reviewStatus: UserReviewStatus;
};

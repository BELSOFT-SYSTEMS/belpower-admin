import { getAdminDemoMode } from '@/lib/adminDemoMode';
import { ADMIN_USER_MESSAGING_ENABLED } from '@/constants/adminFeatureFlags';
import type { AdminUserDetail } from '@/types/adminUserDetail';
import type { TransactionDetailData } from '@/types/adminTransactions';
import { DEMO_TRANSACTIONS, DEMO_USERS } from '@/data/adminListPagesMock';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function buildUserDetail(user: (typeof DEMO_USERS)[number]): AdminUserDetail {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phone: '+234 801 234 5678',
    status: user.status,
    displayStatus: user.displayStatus,
    avatar: null,
    isSuspicious: user.isSuspicious,
    suspiciousActivity: user.suspiciousActivity,
    suspiciousReasons: user.suspiciousReasons,
    riskScore: user.riskScore,
    suspiciousTransactionCount: user.suspiciousActivity ? 2 : 0,
    isInternalTestAccount: user.isInternalTestAccount,
    deletedAt: user.deletedAt,
    createdAt: user.createdAt,
    joinedAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    lastActive: user.lastActive,
    lastLoginAt: user.lastLoginAt ?? hoursAgo(8),
    emailVerified: true,
    phoneVerified: true,
    stats: {
      walletBalance: 48500,
      highestTransactionAmount: 25000,
      lastTransactionAmount: 12500,
      totalSpent: 186400,
      transactionCount: 24,
    },
    quickActions: {
      block: true,
      suspend: true,
      activate: user.displayStatus === 'blocked' || user.displayStatus === 'suspended',
      message: ADMIN_USER_MESSAGING_ENABLED,
      clearSuspicion: user.suspiciousActivity,
      delete: true,
    },
    primaryMeter: {
      id: `${user.id}-meter-1`,
      meterNumber: '45001234567',
      disco: 'IKEDC',
      customerName: user.fullName,
      address: '12 Admiralty Way, Lekki, Lagos',
      meterType: 'prepaid',
      isPrimary: true,
      isVerified: true,
    },
    savedMeters: [
      {
        id: `${user.id}-meter-1`,
        meterNumber: '45001234567',
        disco: 'IKEDC',
        customerName: user.fullName,
        address: '12 Admiralty Way, Lekki, Lagos',
        meterType: 'prepaid',
        isPrimary: true,
        isVerified: true,
      },
    ],
    sessions: [
      {
        id: `${user.id}-session-1`,
        device: 'iPhone 15 Pro',
        ip: '102.89.12.44',
        location: 'Lagos, Nigeria',
        lastActiveAt: hoursAgo(1),
        isCurrent: true,
      },
    ],
    logs: [
      {
        id: `${user.id}-log-1`,
        action: 'Wallet funding',
        detail: 'Added ₦25,000 via card',
        createdAt: hoursAgo(12),
        ip: '102.89.12.44',
      },
    ],
    transactions: DEMO_TRANSACTIONS.filter((tx) => tx.userId === user.id).map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      userId: tx.userId,
      userName: tx.userName,
      type: tx.type,
      service: tx.service,
      provider: tx.provider,
      amount: tx.amount,
      totalAmount: tx.totalAmount,
      serviceCharge: tx.serviceCharge,
      vat: tx.vat,
      status: tx.status,
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
      isScheduled: tx.isScheduled,
      scheduledInfo: tx.scheduledInfo,
      isSuspicious: tx.isSuspicious,
      isBlocked: tx.isBlocked,
      paymentMethod: tx.paymentMethod,
    })),
    security: {
      riskLevel: user.riskScore >= 70 ? 'high' : user.riskScore >= 40 ? 'medium' : 'low',
      failedLoginAttempts: user.suspiciousActivity ? 2 : 0,
      twoFactorEnabled: true,
      lastPasswordChangeAt: daysAgo(30),
      reviewStatus: user.suspiciousActivity ? 'under_review' : 'cleared',
      lastReviewedAt: user.suspiciousActivity ? hoursAgo(20) : null,
      lastReviewedBy: user.suspiciousActivity ? 'demo-admin-001' : null,
      suspiciousTransactionCount: user.suspiciousActivity ? 2 : 0,
      latestIp: '102.89.12.44',
      latestIpScore: user.suspiciousActivity ? 72 : 18,
      maxIpScore: user.suspiciousActivity ? 72 : 18,
    },
    fraudEvents: user.suspiciousActivity
      ? [
          {
            id: 'demo-fraud-001',
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            eventType: 'DUPLICATE TRANSACTION BLOCKED',
            code: 'DUPLICATE_TRANSACTION_COOLDOWN',
            severity: 'high',
            message: 'Duplicate transaction blocked during demo',
            amount: 5000,
            paymentFor: 'electricity',
            paymentMethod: 'wallet',
            ipAddress: '102.89.12.44',
            userAgent: 'node',
            requestPath: '/api/v1/electricity/purchase',
            payload: null,
            actionTaken: user.isInternalTestAccount ? 'flagged_only' : 'blocked_and_suspended',
            isInternalTestAccount: user.isInternalTestAccount,
            reviewStatus: 'open',
            reviewedAt: null,
            reviewedByAdminId: null,
            reviewNotes: null,
            createdAt: hoursAgo(3),
            updatedAt: hoursAgo(3),
          },
        ]
      : [],
    fraudEventCount: user.suspiciousActivity ? 1 : 0,
    generatedAt: new Date().toISOString(),
  };
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

function buildTransactionDetail(tx: (typeof DEMO_TRANSACTIONS)[number]): TransactionDetailData {
  return {
    ...tx,
    orderId: `ORD-${tx.reference.slice(-5)}`,
    meterNumber: tx.type === 'electricity' ? '45001234567' : null,
    token: tx.type === 'electricity' ? '1234-5678-9012-3456' : null,
    units: tx.type === 'electricity' ? 42.5 : null,
    phoneNumber: tx.type === 'airtime' || tx.type === 'data' ? '08012345678' : null,
    smartcardNumber: tx.type === 'cable' ? '4028123456' : null,
    packageName: tx.type === 'cable' ? 'DStv Compact' : null,
    dataBundle: tx.type === 'data' ? '10GB — 30 days' : null,
    customerName: tx.userName,
    address: tx.type === 'electricity' ? '12 Admiralty Way, Lekki, Lagos' : null,
    fraud: {
      reviewStatus: tx.isSuspicious ? 'under_review' : 'cleared',
      riskReason: tx.fraudReason ?? null,
      auditorNotes: tx.isSuspicious ? 'Flagged for review during demo.' : null,
      lastReviewedAt: tx.isSuspicious ? hoursAgo(6) : null,
      lastReviewedBy: tx.isSuspicious ? 'demo-admin-001' : null,
    },
    payment: {
      method: tx.paymentMethod ?? 'Wallet',
      gatewayReference: `GW-${tx.reference}`,
      walletDebitReference:
        tx.paymentMethod?.toLowerCase() === 'wallet' ? `WD-${tx.reference}` : null,
      providerReference: `PR-${tx.reference}`,
    },
    user: {
      id: tx.userId,
      fullName: tx.userName,
      email: `${tx.userName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      isInternalTestAccount: tx.isInternalTestAccount,
    },
    requery: {
      eligible: tx.status === 'pending',
      recommended: tx.status === 'pending',
      excludeFromAutoRequery: false,
      autoRequeryPaused: false,
      hasOrderId: true,
      orderId: `ORD-${tx.reference.slice(-5)}`,
      supportsBuyPowerRequery: true,
      requeryCount: 0,
      maxRequeryCount: 3,
      requeryProcessed: false,
      reason: null,
    },
    quickActions: {
      review: true,
      block: true,
      unblock: tx.isBlocked,
      clearReview: true,
      requery: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getMockUserDetail(userId: string): AdminUserDetail | null {
  const user = DEMO_USERS.find((item) => item.id === userId);
  if (!user) return null;
  return buildUserDetail(user);
}

export function getMockTransactionDetail(transactionId: string): TransactionDetailData | null {
  const tx = DEMO_TRANSACTIONS.find(
    (item) => item.id === transactionId || item.reference === transactionId
  );
  if (!tx) return null;
  return buildTransactionDetail(tx);
}

export function demoShowsFullData(): boolean {
  return getAdminDemoMode();
}

/** Frontend contract for GET /transactions and GET /transactions/:id — share with backend. */

export type TransactionType =
  | 'electricity'
  | 'airtime'
  | 'data'
  | 'cable'
  | 'deposit'
  | 'refund'
  | 'cashback';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'scheduled';

export type TransactionReviewStatus =
  | 'cleared'
  | 'under_review'
  | 'escalated'
  | 'pending'
  | 'blocked';

export type TransactionsQuickActions = {
  review: boolean;
  block: boolean;
  unblock: boolean;
  clearReview: boolean;
  requery: boolean;
  refund: boolean;
};

export type TransactionsVolumeStat = {
  amount: number;
  currency: 'NGN';
  definition: string;
};

export type TransactionsCountVolumeStat = {
  amount: number;
  count: number;
  definition: string;
};

export type TransactionsCountStat = {
  count: number;
  definition: string;
};

/**
 * GET /transactions stats (includeStats=true) and GET /transactions/overview.
 *
 * Backend contract:
 * - Always return count stats aligned with volume scope: totalTransactions
 *   (same rows as totalVolume), completedTransactions, pendingTransactions,
 *   refundTransactions, plus blocked, under review, and flagged.
 * - Return money stats (totalVolume, completed, pending, refunds) only when
 *   the caller has dashboard.money_stats (super_admin, finance).
 * - Set filters.canViewMoneyStats to match whether money fields are present.
 */
export type TransactionsListStats = {
  /** ₦ totals — present only when filters.canViewMoneyStats is true */
  totalVolume?: TransactionsVolumeStat | null;
  completed?: TransactionsCountVolumeStat | null;
  pending?: TransactionsCountVolumeStat | null;
  refunds?: TransactionsCountVolumeStat | null;
  /** Count-only — always returned for roles with transactions.list */
  totalTransactions: TransactionsCountStat;
  completedTransactions: TransactionsCountStat;
  pendingTransactions: TransactionsCountStat;
  refundTransactions: TransactionsCountStat;
  blocked: TransactionsCountStat;
  underReview: TransactionsCountStat;
  flagged: TransactionsCountStat;
};

export type TransactionsListFilters = {
  types: TransactionType[];
  statuses: Array<TransactionStatus | 'flagged' | 'scheduled'>;
  canViewInternalTestTransactions: boolean;
  /** True for super_admin and finance (dashboard.money_stats). */
  canViewMoneyStats: boolean;
  appliedType: string | null;
  appliedStatus: string | null;
  appliedFlagged: boolean;
  appliedUserId: string | null;
};

export type TransactionScheduledInfo = {
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | string;
  nextPurchaseAt: string;
};

export type ApiTransactionListItem = {
  id: string;
  reference: string;
  userId: string;
  partnerId?: string | null;
  customerType?: TransactionCustomerType;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  userName: string;
  type: TransactionType;
  service: string;
  provider: string;
  amount: number;
  amountPurchased?: number | null;
  totalAmount: number;
  serviceCharge: number;
  vat: number;
  status: TransactionStatus;
  createdAt: string;
  completedAt: string | null;
  isScheduled: boolean;
  scheduledInfo?: TransactionScheduledInfo;
  isSuspicious: boolean;
  isBlocked: boolean;
  reviewStatus?: TransactionReviewStatus | 'blocked' | null;
  canClearReview?: boolean;
  fraudReason?: string | null;
  isInternalTestAccount?: boolean;
  paymentMethod?: string | null;
  requeryRecommended?: boolean;
  requeryReason?: string | null;
  isRefund?: boolean;
  isCashback?: boolean;
  originalTransactionId?: string | null;
  refundReason?: string | null;
  cashbackSourceType?: string | null;
  cashbackRate?: string | null;
  cashbackDescription?: string | null;
};

export type TransactionsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  total_pages?: number;
};

export type TransactionsListData = {
  stats: TransactionsListStats | null;
  quickActions: TransactionsQuickActions;
  transactions: ApiTransactionListItem[];
  pagination: TransactionsPagination;
  filters: TransactionsListFilters;
  generatedAt?: string;
};

export type TransactionsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  flagged?: boolean;
  userId?: string;
  partnerId?: string;
  paymentMethod?: string;
  walletActivity?: boolean;
  sort?: string;
  includeStats?: boolean;
};

export type TransactionFraudInfo = {
  reviewStatus: TransactionReviewStatus;
  riskReason?: string | null;
  auditorNotes?: string | null;
  lastReviewedAt?: string | null;
  lastReviewedBy?: string | null;
};

export type TransactionPaymentInfo = {
  method?: string | null;
  gatewayReference?: string | null;
  walletDebitReference?: string | null;
  providerReference?: string | null;
  walletBalanceBefore?: number | null;
  walletBalanceAfter?: number | null;
};

export type TransactionCustomerType = 'user' | 'partner' | 'guest' | 'anonymous';

export type TransactionUserInfo = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  purchaseCustomerName?: string | null;
  customerType?: TransactionCustomerType;
  partnerId?: string | null;
  isInternalTestAccount?: boolean;
};

export type TransactionManualRequeryInfo = {
  at: string;
  adminId: string;
};

/** Manual / auto requery state from GET /transactions/:id */
export type TransactionRequeryInfo = {
  eligible: boolean;
  recommended: boolean;
  excludeFromAutoRequery: boolean;
  autoRequeryPaused: boolean;
  autoRequeryPausedReason?: string | null;
  hasOrderId: boolean;
  orderId?: string | null;
  supportsBuyPowerRequery: boolean;
  lastRequeryAt?: string | null;
  requeryCount: number;
  maxRequeryCount: number;
  timeoutReason?: string | null;
  requeryProcessed: boolean;
  nextRetryAt?: string | null;
  lastManualRequery?: TransactionManualRequeryInfo | null;
  reason?: string | null;
};

export type TransactionRefundInfo = {
  eligible: boolean;
  reason?: string | null;
  amount?: number | null;
  walletRefunded: boolean;
  refundTransactionId?: string | null;
  refundAmount?: number | null;
};

/** Detail — extends list item with full service/payment/fraud fields */
export type ApiTransactionDetail = ApiTransactionListItem & {
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
  fraud: TransactionFraudInfo;
  payment: TransactionPaymentInfo;
  user: TransactionUserInfo;
  requery: TransactionRequeryInfo;
  refund: TransactionRefundInfo;
  generatedAt: string;
};

export type TransactionDetailData = ApiTransactionDetail & {
  quickActions: TransactionsQuickActions;
};

export type BlockTransactionResult = {
  transactionId: string;
  isBlocked: boolean;
};

export type UnblockTransactionResult = {
  transactionId: string;
  isBlocked: boolean;
};

export type ClearTransactionReviewResult = {
  transactionId: string;
  reviewStatus: TransactionReviewStatus;
};

export type RequeryTransactionResult = {
  transactionId: string;
  status: TransactionStatus;
  reviewStatus?: TransactionReviewStatus;
};

export type RefundTransactionResult = {
  refund: {
    success: boolean;
    message?: string;
    refundTransaction?: { id: string; amount: number; reference?: string };
    newBalance?: number;
  };
};

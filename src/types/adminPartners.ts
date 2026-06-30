export type PartnerStatus =
  | 'pending_review'
  | 'active'
  | 'rejected'
  | 'blocked'
  | 'deactivated';

export type PartnersQuickActions = {
  approve: boolean;
  reject: boolean;
  reopenReview: boolean;
  block: boolean;
  unblock: boolean;
  deactivate: boolean;
  walletCreditManual: boolean;
  refundsUnblock: boolean;
};

export type PartnersPageStats = {
  totalPartners: { count: number; definition: string };
  pendingReview: { count: number; definition: string };
  activePartners: { count: number; definition: string };
  blockedPartners: { count: number; definition: string };
  refundsBlocked: { count: number; definition: string };
  deactivatedPartners: { count: number; definition: string };
  rejectedPartners: { count: number; definition: string };
};

export type PartnersListFilters = {
  statuses: PartnerStatus[];
  appliedStatus: string | null;
  refundsBlocked: boolean;
};

export type PartnerListItem = {
  id: string;
  agentFullName: string;
  tradingName?: string | null;
  businessName: string;
  cacRegistrationNumber: string;
  phone: string;
  email: string;
  status: PartnerStatus;
  emailVerified: boolean;
  walletBalance: number;
  canAccessDashboard: boolean;
  refundsBlocked?: boolean;
  refundsBlockedAt?: string | null;
  refundsBlockedReason?: string | null;
  refundsUnblockedAt?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
};

export type PartnerApiKeySummary = {
  id: string;
  keyType: 'test' | 'live';
  label: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
};

export type PartnerDetail = PartnerListItem & {
  agreedToTerms: boolean;
  notifyDiscoOutages: boolean;
  notifyLowBalance?: boolean;
  notifyNewsUpdates?: boolean;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  transactionTotal?: number;
  apiKeys: PartnerApiKeySummary[];
  quickActions: PartnersQuickActions;
};

export type PartnersListData = {
  stats: PartnersPageStats | null;
  quickActions: PartnersQuickActions;
  filters: PartnersListFilters;
  partners: PartnerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  generatedAt?: string;
};

export type PartnersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: PartnerStatus | '__all__' | 'refunds_blocked';
  includeStats?: boolean;
};

export type PartnerActionPayload = {
  partnerId: string;
  note?: string;
  reason?: string;
};

export type PartnerTransactionItem = {
  id: string;
  reference: string;
  order_id: string | null;
  service_type: string;
  amount: number;
  service_charge: number;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
  metadata: {
    partner_reference?: string | null;
    partner_api_mode?: string;
    simulated?: boolean;
  };
};

export type PartnerApiKeyRotateResult = {
  keyType: 'test' | 'live';
  apiKey: string;
  label: string;
  maskedLabel: string;
  rotatedAt: string;
};

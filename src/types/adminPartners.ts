export type PartnerStatus =
  | 'pending_review'
  | 'active'
  | 'rejected'
  | 'blocked'
  | 'deactivated';

export type PartnerListItem = {
  id: string;
  agentFullName: string;
  businessName: string;
  cacRegistrationNumber: string;
  phone: string;
  email: string;
  status: PartnerStatus;
  emailVerified: boolean;
  walletBalance: number;
  canAccessDashboard: boolean;
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
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  apiKeys: PartnerApiKeySummary[];
};

export type PartnersListData = {
  partners: PartnerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PartnersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: PartnerStatus | '__all__';
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

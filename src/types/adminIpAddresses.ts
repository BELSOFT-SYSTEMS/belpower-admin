export type IpAddressRecordType = 'block' | 'whitelist';

export type IpAddressStatus =
  | 'blocked'
  | 'banned'
  | 'whitelisted'
  | 'expired'
  | 'removed'
  | 'unblocked';

export type IpAddressSource = 'admin' | 'rate_limit' | 'honeytoken' | 'system';

export type IpAddressCategoryFilter =
  | 'all'
  | 'blacklisted'
  | 'blocked'
  | 'banned'
  | 'whitelisted';

export type IpAddressRecord = {
  id: string;
  ipAddress: string;
  recordType: IpAddressRecordType;
  status: IpAddressStatus;
  reason?: string | null;
  description?: string | null;
  offenseCount?: number;
  isPermanent?: boolean;
  expiresAt?: string | null;
  source?: IpAddressSource | null;
  adminId?: string | null;
  createdByAdminId?: string | null;
  createdByAdminEmail?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
};

export type IpAddressStats = {
  activeBlockedCount: number;
  permanentBannedCount: number;
  blacklistedCount: number;
  whitelistedCount: number;
  autoBlocked24h: number;
  expiring24h: number;
};

export type IpAddressesListParams = {
  page?: number;
  limit?: number;
  category?: IpAddressCategoryFilter;
  search?: string;
};

export type IpAddressesListData = {
  items: IpAddressRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type IpAddressActionPayload = {
  ipAddress: string;
  reason?: string;
  description?: string;
  durationHours?: number;
};

export type IpAddressLookup = {
  ipAddress: string;
  isWhitelisted: boolean;
  whitelist: IpAddressRecord | null;
  activeBlock: IpAddressRecord | null;
};

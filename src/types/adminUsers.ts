export type UserDisplayStatus =
  | 'active'
  | 'new'
  | 'dormant'
  | 'blocked'
  | 'suspended'
  | 'inactive'
  | 'deleted';

export type UsersQuickActions = {
  block: boolean;
  suspend: boolean;
  activate: boolean;
  message: boolean;
  clearSuspicion?: boolean;
};

export type UsersPageStats = {
  totalUsers?: { count: number; definition: string };
  newUsers: { count: number; period: '7d'; definition: string };
  activeUsers: { count: number; definition: string };
  flaggedUsers: { count: number; definition: string };
  blockedUsers: { count: number; definition: string };
  suspendedUsers: { count: number; definition: string };
  deletedUsers?: { count: number; definition: string };
};

export type UsersListFilters = {
  statuses: UserDisplayStatus[];
  canViewDeletedUsers: boolean;
  canViewInternalTestUsers: boolean;
  appliedStatus: string | null;
  includeDeleted: boolean;
  appliedHasWalletBalance?: boolean;
};

export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  displayStatus: UserDisplayStatus;
  suspiciousActivity: boolean;
  isSuspicious: boolean;
  riskScore: number;
  suspiciousReasons: string[];
  lastActiveAt: string | null;
  lastActive: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  deletedAt: string | null;
  isInternalTestAccount: boolean;
  avatar: string | null;
};

export type UsersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  total_pages?: number;
};

export type UsersListData = {
  stats: UsersPageStats | null;
  quickActions: UsersQuickActions;
  users: ApiUser[];
  pagination: UsersPagination;
  filters: UsersListFilters;
  generatedAt?: string;
};

export type UsersListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  suspicious?: boolean;
  hasWalletBalance?: boolean;
  sort?: string;
  includeStats?: boolean;
  includeDeleted?: boolean;
};

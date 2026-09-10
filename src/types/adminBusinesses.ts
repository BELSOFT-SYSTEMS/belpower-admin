export type BusinessListItem = {
  id: string;
  businessId: string;
  businessName: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string | null;
  userCount: number;
  branchCount: number;
  companyBalance: number;
  totalBranchBalance: number;
  walletStatus: string | null;
};

export type BusinessesPageStats = {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
};

export type BusinessesListData = {
  stats: BusinessesPageStats | null;
  filters: {
    statuses: string[];
    appliedStatus: string | null;
  };
  businesses: BusinessListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type BusinessesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type BusinessDetail = {
  id: string;
  businessId: string;
  businessName: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: string;
  status: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  companyWallet: {
    id: string;
    availableBalance: number;
    balance: number;
    status: string;
    isFrozen?: boolean;
  } | null;
  wallets: Array<{
    id: string;
    scope: string;
    branchId: string | null;
    branchName: string | null;
    availableBalance: number;
    balance: number;
    status: string;
  }>;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    branchId: string | null;
    createdAt: string | null;
  }>;
  branches: Array<{
    id: string;
    name: string;
    code: string | null;
    city: string | null;
    status: string;
    isHeadOffice: boolean;
    meterNumber: string | null;
    disco: string | null;
  }>;
  stats: {
    transactionCount: number;
    completedDebitVolume: number;
    userCount: number;
    branchCount: number;
  };
};

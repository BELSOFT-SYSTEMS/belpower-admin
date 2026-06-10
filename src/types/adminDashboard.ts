export type DashboardStatAmount = {
  visible: boolean;
  amount: number;
  currency: string;
};

export type DashboardStats = {
  totalPayments: DashboardStatAmount;
  totalTransactions: number;
  activeUsers: number;
  pendingTransactions: number;
};

export type DashboardRecentTransaction = {
  id: string;
  reference: string;
  userId: string | null;
  guestUserId: string | null;
  userName: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  paymentFor: string;
  createdAt: string;
  isInternalTestAccount?: boolean;
};

export type DashboardNewUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  createdAt: string;
  isInternalTestAccount?: boolean;
};

export type DashboardFilters = {
  canViewInternalTestUsers: boolean;
  canViewDeletedUsers: boolean;
  appliedUserId: string | null;
};

export type DashboardRevenuePoint = {
  month: string;
  amount: number;
};

export type DashboardCountPoint = {
  month: string;
  count: number;
};

export type DashboardCharts = {
  revenueOverview: {
    visible: boolean;
    series: DashboardRevenuePoint[];
  };
  transactionVolume: DashboardCountPoint[];
  userGrowth: DashboardCountPoint[];
};

export type DashboardOverview = {
  stats: DashboardStats;
  recentTransactions: DashboardRecentTransaction[];
  newUsers: DashboardNewUser[];
  charts: DashboardCharts;
  filters: DashboardFilters;
  generatedAt: string;
};

export type DashboardChartPoint = {
  label: string;
  period: string;
  value: number;
};

export type DashboardOverviewParams = {
  months?: number;
  recentLimit?: number;
  userId?: string;
};

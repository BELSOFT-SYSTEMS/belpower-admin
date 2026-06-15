export type WalletBalanceStat = {
  amount: number | null;
  currency: 'NGN';
  canView: boolean;
  lastUpdated?: string | null;
};

export type WalletCountStat = {
  count: number;
};

export type WalletProfitStat = {
  amount: number | null;
  currency: 'NGN';
  canView: boolean;
  definition?: string;
};

export type WalletOverviewStats = {
  totalUserBalance: WalletBalanceStat;
  buyPowerBalance: WalletBalanceStat;
  profit: WalletProfitStat;
  fundingCount: WalletCountStat;
  debitCount: WalletCountStat;
  flaggedCount: WalletCountStat;
};

export type WalletActivityFilter = 'all' | 'deposit' | 'debit';

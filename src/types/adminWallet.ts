export type WalletBalanceStat = {
  amount: number | null;
  currency: 'NGN';
  canView: boolean;
  lastUpdated?: string | null;
};

export type WalletCountStat = {
  count: number;
};

export type WalletOverviewStats = {
  totalUserBalance: WalletBalanceStat;
  buyPowerBalance: WalletBalanceStat;
  fundingCount: WalletCountStat;
  debitCount: WalletCountStat;
  flaggedCount: WalletCountStat;
};

export type WalletActivityFilter = 'all' | 'deposit' | 'debit';

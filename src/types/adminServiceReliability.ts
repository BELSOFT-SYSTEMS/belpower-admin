export type ProviderHealth = 'healthy' | 'degraded' | 'offline';

export type ProviderVertical = 'ELECTRICITY' | 'DATA' | 'TV' | 'VTU' | string;

export type ReliabilityProvider = {
  vertical: ProviderVertical;
  verticalLabel: string;
  discoCode: string;
  displayName: string;
  successPercentage: number;
  pendingPercentage: number;
  failurePercentage: number;
  providerOnline: boolean;
  health: ProviderHealth;
};

export type ReliabilitySummary = {
  healthy: number;
  degraded: number;
  offline: number;
  total: number;
};

export type ServiceReliabilityData = {
  providers: ReliabilityProvider[];
  summary: ReliabilitySummary;
  fetchedAt: string;
};

export type ReliabilityFilter =
  | 'ALL'
  | 'ELECTRICITY'
  | 'DATA'
  | 'TV'
  | 'VTU';

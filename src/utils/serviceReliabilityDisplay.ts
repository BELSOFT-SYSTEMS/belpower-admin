import { getDiscoDisplayName } from '@/constants/discoNames';
import { getDiscoIcon, getTransactionIcon } from '@/utils/transactionIcons';
import type {
  ProviderHealth,
  ReliabilityFilter,
  ReliabilityProvider,
} from '@/types/adminServiceReliability';

export const RELIABILITY_FILTERS: { value: ReliabilityFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'DATA', label: 'Data' },
  { value: 'TV', label: 'Cable TV' },
  { value: 'VTU', label: 'Airtime' },
];

export function getReliabilityProviderName(provider: ReliabilityProvider): string {
  return provider.displayName || getDiscoDisplayName(provider.discoCode);
}

export function getReliabilityProviderIcon(provider: ReliabilityProvider): string {
  const code = provider.discoCode.toLowerCase();

  if (provider.vertical === 'ELECTRICITY') {
    return getDiscoIcon(provider.discoCode);
  }

  if (provider.vertical === 'TV') {
    return getTransactionIcon({ type: 'cable', provider: code });
  }

  if (provider.vertical === 'DATA') {
    return getTransactionIcon({ type: 'data', provider: code });
  }

  if (provider.vertical === 'VTU') {
    return getTransactionIcon({ type: 'airtime', provider: code });
  }

  return '/electricity.png';
}

export function filterReliabilityProviders(
  providers: ReliabilityProvider[],
  filter: ReliabilityFilter
): ReliabilityProvider[] {
  if (filter === 'ALL') return providers;
  return providers.filter((provider) => provider.vertical === filter);
}

export function getReliabilityHealthConfig(health: ProviderHealth) {
  switch (health) {
    case 'offline':
      return {
        badge: 'Offline',
        badgeClass: 'status_offline',
        label: 'Provider offline',
        statusClass: 'health_not_optimal',
      };
    case 'degraded':
      return {
        badge: 'Degraded',
        badgeClass: 'status_unstable',
        label: 'High failure rate',
        statusClass: 'health_unstable',
      };
    default:
      return {
        badge: 'Healthy',
        badgeClass: 'status_online',
        label: 'Operating normally',
        statusClass: 'health_optimal',
      };
  }
}

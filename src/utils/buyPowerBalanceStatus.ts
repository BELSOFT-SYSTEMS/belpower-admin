export type BuyPowerBalanceLevel = 'healthy' | 'warning' | 'critical';

export type BuyPowerBalanceStatus = {
  level: BuyPowerBalanceLevel;
  label: string;
  className: string;
};

export const BUYPOWER_BALANCE_HEALTHY_MIN = 1_000_000;
export const BUYPOWER_BALANCE_WARNING_MIN = 500_000;

export function getBuyPowerBalanceStatus(
  balance: number | null | undefined
): BuyPowerBalanceStatus {
  const amount = Number(balance) || 0;
  if (amount >= BUYPOWER_BALANCE_HEALTHY_MIN) {
    return {
      level: 'healthy',
      label: 'Healthy',
      className: 'analytics_balance_healthy',
    };
  }
  if (amount >= BUYPOWER_BALANCE_WARNING_MIN) {
    return {
      level: 'warning',
      label: 'Going low',
      className: 'analytics_balance_warning',
    };
  }
  return {
    level: 'critical',
    label: 'Critical',
    className: 'analytics_balance_critical',
  };
}

export function getDeltaClass(deltaPct: number | null | undefined): string {
  if (deltaPct == null || Number.isNaN(deltaPct) || deltaPct === 0) {
    return 'analytics_delta_flat';
  }
  return deltaPct > 0 ? 'analytics_delta_up' : 'analytics_delta_down';
}

export function formatDeltaPct(deltaPct: number | null | undefined): string {
  if (deltaPct == null || Number.isNaN(deltaPct)) return '—';
  const abs = Math.abs(deltaPct);
  const sign = deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '→';
  return `${sign} ${abs.toFixed(1)}%`;
}

'use client';

import { AdminCopyableValue } from '@/components/admin/ui/AdminCopyableValue';

type Props = {
  token?: string | null;
  units?: number | null;
  status?: string;
  variant?: 'overview' | 'panel';
  className?: string;
};

function formatUnits(units: number | null | undefined): string | null {
  if (units == null || !Number.isFinite(units) || units <= 0) return null;
  return `${units} kWh`;
}

export function ElectricityTokenPanel({
  token,
  units,
  status,
  variant = 'panel',
  className = '',
}: Props) {
  const trimmedToken = token?.trim() ?? '';
  const hasToken = trimmedToken.length > 0;
  const unitsLabel = formatUnits(units);
  const isCompleted = status === 'completed';

  if (!hasToken && !isCompleted) {
    return null;
  }

  if (variant === 'overview') {
    if (!hasToken) return null;

    return (
      <div className={`txn_overview_token ${className}`.trim()}>
        <AdminCopyableValue
          label="Electricity token"
          value={trimmedToken}
          copyLabel="Copy token"
        />
        {unitsLabel ? (
          <span className="txn_overview_token_units">{unitsLabel}</span>
        ) : null}
      </div>
    );
  }

  if (hasToken) {
    return (
      <div className={`service_detail_token_card ${className}`.trim()}>
        {unitsLabel ? (
          <span className="service_detail_token_units service_detail_token_units_block">
            {unitsLabel}
          </span>
        ) : null}
        <AdminCopyableValue
          label="Electricity token"
          value={trimmedToken}
          copyLabel="Copy token"
        />
      </div>
    );
  }

  return (
    <div className={`service_detail_token_card ${className}`.trim()}>
      <span className="service_detail_token_label">Electricity token</span>
      <p className="service_detail_token_missing">
        Token not available on this transaction yet. Try a manual requery from the
        transaction actions, or check the BuyPower reference under Payment &amp; references.
      </p>
    </div>
  );
}

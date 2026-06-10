'use client';

import { formatPrice } from '@/utils/FormatPrice';
import {
  getTransactionAmountBreakdown,
  type TransactionAmountBreakdownRow,
} from '@/utils/transactionAmountDisplay';

type Props = {
  transaction: Parameters<typeof getTransactionAmountBreakdown>[0];
  rowClassName?: string;
  totalClassName?: string;
};

function BreakdownRow({
  row,
  rowClassName,
  totalClassName,
}: {
  row: TransactionAmountBreakdownRow;
  rowClassName: string;
  totalClassName: string;
}) {
  const isTotal = row.emphasize;

  return (
    <div
      className={
        isTotal ? `${rowClassName} ${totalClassName}`.trim() : rowClassName
      }
    >
      <span>{row.label}</span>
      {isTotal ? <strong>{formatPrice(row.value)}</strong> : <span>{formatPrice(row.value)}</span>}
    </div>
  );
}

export function TransactionAmountBreakdown({
  transaction,
  rowClassName = 'txn_overview_breakdown_row',
  totalClassName = 'txn_overview_breakdown_total',
}: Props) {
  const rows = getTransactionAmountBreakdown(transaction);

  return (
    <>
      {rows.map((row) => (
        <BreakdownRow
          key={row.label}
          row={row}
          rowClassName={rowClassName}
          totalClassName={totalClassName}
        />
      ))}
    </>
  );
}

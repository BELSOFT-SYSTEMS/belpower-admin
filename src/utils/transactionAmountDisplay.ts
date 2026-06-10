import type { TransactionType } from '@/types/adminTransactions';

export type TransactionAmountBreakdownRow = {
  label: string;
  value: number;
  emphasize?: boolean;
};

type BreakdownInput = {
  type: TransactionType;
  amount: number;
  service_charge?: number;
  serviceCharge?: number;
  vat?: number;
  total_amount?: number;
  totalAmount?: number;
  amount_purchased?: number | null;
  amountPurchased?: number | null;
};

function serviceChargeOf(tx: BreakdownInput): number {
  return tx.service_charge ?? tx.serviceCharge ?? 0;
}

function totalOf(tx: BreakdownInput): number {
  return tx.total_amount ?? tx.totalAmount ?? tx.amount + serviceChargeOf(tx);
}

function amountPurchasedOf(tx: BreakdownInput): number | null {
  const value = tx.amount_purchased ?? tx.amountPurchased;
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const vat = tx.vat ?? 0;
  // Amount purchased must not mirror amount paid when VAT applies (different BuyPower fields).
  if (tx.type === 'electricity' && vat > 0 && value === tx.amount) return null;
  return value;
}

export function showsVatRow(type: TransactionType): boolean {
  return type === 'electricity';
}

export function getPrimaryAmountLabel(type: TransactionType): string {
  if (type === 'electricity') return 'Amount paid';
  if (type === 'cable') return 'Package amount';
  return 'Amount';
}

export function getPaymentMethodLabel(method?: string | null): string {
  if (!method) return 'Unknown';
  const key = method.toLowerCase().trim().replace(/_/g, '-');
  if (key === 'wallet') return 'Wallet';
  if (key === 'card') return 'Card';
  if (key === 'buypower-dva' || key === 'bank-transfer' || key === 'banktransfer') {
    return 'Bank transfer (BuyPower)';
  }
  if (key === 'dva') return 'Bank transfer (Paystack)';
  if (key === 'bank_transfer') return 'Bank transfer';
  return method;
}

/** Amount rows aligned with belpower-frontend electricity/cable/DVA billing. */
export function getTransactionAmountBreakdown(
  tx: BreakdownInput
): TransactionAmountBreakdownRow[] {
  const serviceCharge = serviceChargeOf(tx);
  const vat = tx.vat ?? 0;
  const total = totalOf(tx);
  const amountPurchased = amountPurchasedOf(tx);
  const rows: TransactionAmountBreakdownRow[] = [];

  rows.push({
    label: getPrimaryAmountLabel(tx.type),
    value: tx.amount,
  });

  rows.push({
    label: 'Service charge',
    value: serviceCharge,
  });

  if (tx.type === 'electricity') {
    rows.push({
      label: 'Amount purchased',
      value: amountPurchased ?? 0,
    });
  }

  if (showsVatRow(tx.type)) {
    rows.push({
      label: 'VAT',
      value: vat,
    });
  }

  rows.push({
    label: 'Total paid',
    value: total,
    emphasize: true,
  });

  return rows;
}

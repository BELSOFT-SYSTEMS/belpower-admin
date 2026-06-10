import type { AdminTransaction } from '@/data/adminMockData';
import type { TransactionDetailData } from '@/types/adminTransactions';
import { mapApiTransactionListItem } from '@/utils/mapApiTransactionListItem';

export function mapApiTransactionDetail(detail: TransactionDetailData): AdminTransaction {
  const transaction = mapApiTransactionListItem(detail);

  return {
    ...transaction,
    order_id: detail.orderId ?? undefined,
    meter_number: detail.meterNumber ?? undefined,
    token: detail.token ?? undefined,
    units: detail.units ?? undefined,
    phone_number: detail.phoneNumber ?? undefined,
    smartcard_number: detail.smartcardNumber ?? undefined,
    package_name: detail.packageName ?? undefined,
    data_bundle: detail.dataBundle ?? undefined,
    customer_name: detail.customerName ?? undefined,
    address: detail.address ?? undefined,
    payment_method: detail.payment.method ?? detail.paymentMethod ?? transaction.payment_method,
    fraud_reason: detail.fraud.riskReason ?? detail.fraudReason ?? transaction.fraud_reason,
  };
}

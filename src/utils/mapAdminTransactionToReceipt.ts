import type { TransactionDetailData, TransactionStatus } from '@/types/adminTransactions';
import type { ReceiptTransaction } from '@/components/receipt/ReceiptHTML';
import { getPaymentMethodLabel } from '@/utils/transactionAmountDisplay';

function getReceiptStatus(status: TransactionStatus): {
  statusLabel: string;
  statusClass: 'success' | 'pending' | 'failed';
} {
  if (status === 'completed') {
    return { statusLabel: 'Success', statusClass: 'success' };
  }
  if (status === 'failed') {
    return { statusLabel: 'Failed', statusClass: 'failed' };
  }
  return { statusLabel: status.charAt(0).toUpperCase() + status.slice(1), statusClass: 'pending' };
}

function buildReceiptBase(detail: TransactionDetailData): ReceiptTransaction {
  const paymentMethod = detail.payment.method ?? detail.paymentMethod ?? undefined;
  const paymentMethodLabel = getPaymentMethodLabel(paymentMethod);
  const { statusLabel, statusClass } = getReceiptStatus(detail.status);

  return {
    id: detail.id,
    date: detail.completedAt ?? detail.createdAt,
    type: detail.type,
    service: detail.service,
    provider: detail.provider,
    reference: detail.reference,
    transactionRef: detail.reference,
    orderId: detail.orderId ?? undefined,
    order_id: detail.orderId ?? undefined,
    receipt_number: detail.orderId ?? detail.reference,
    receiptNumber: detail.orderId ?? detail.reference,
    phoneNumber: detail.phoneNumber ?? undefined,
    phone_number: detail.phoneNumber ?? undefined,
    meterNumber: detail.meterNumber ?? undefined,
    meter_number: detail.meterNumber ?? undefined,
    smartCardNumber: detail.smartcardNumber ?? undefined,
    smartcard_number: detail.smartcardNumber ?? undefined,
    packageName: detail.packageName ?? detail.dataBundle ?? undefined,
    bundleSize: detail.dataBundle ?? detail.packageName ?? undefined,
    token: detail.token ?? undefined,
    units: detail.units ?? undefined,
    customerName: detail.customerName ?? undefined,
    address: detail.address ?? undefined,
    payer: detail.user.fullName,
    fullName: detail.user.fullName,
    customerEmail: detail.user.email ?? undefined,
    customerPhone: detail.phoneNumber ?? undefined,
    payment_method: paymentMethod ?? undefined,
    paymentType: paymentMethod ?? undefined,
    paymentMethodLabel,
    depositType: detail.type === 'deposit' ? paymentMethodLabel : undefined,
    statusLabel,
    statusClass,
    discount: 0,
    metadata: {
      dataBundle: detail.dataBundle ?? undefined,
    },
  };
}

/**
 * Maps admin transaction detail to ReceiptHTML/PDF fields.
 * Aligned with belpower-frontend buildElectricityReceiptPdfFields + cable breakdown rules.
 */
export function mapAdminTransactionToReceipt(detail: TransactionDetailData): ReceiptTransaction {
  const base = buildReceiptBase(detail);

  if (detail.type === 'electricity') {
    const amountPurchased =
      detail.amountPurchased != null &&
      detail.amountPurchased > 0 &&
      !(detail.vat > 0 && detail.amountPurchased === detail.amount)
        ? detail.amountPurchased
        : 0;

    return {
      ...base,
      amount_paid: detail.amount,
      amountGenerated: amountPurchased,
      vatAmount: detail.vat,
      serviceCharge: detail.serviceCharge,
      service_charge: detail.serviceCharge,
      totalAmount: detail.totalAmount,
      total_amount: detail.totalAmount,
    };
  }

  if (detail.type === 'cable') {
    return {
      ...base,
      amount_paid: detail.amount,
      vatAmount: 0,
      serviceCharge: detail.serviceCharge,
      service_charge: detail.serviceCharge,
      totalAmount: detail.totalAmount,
      total_amount: detail.totalAmount,
    };
  }

  if (detail.type === 'deposit') {
    return {
      ...base,
      amount_paid: detail.totalAmount,
      vatAmount: 0,
      serviceCharge: 0,
      service_charge: 0,
      totalAmount: detail.totalAmount,
      total_amount: detail.totalAmount,
    };
  }

  return {
    ...base,
    amount_paid: detail.amount,
    vatAmount: 0,
    serviceCharge: detail.serviceCharge,
    service_charge: detail.serviceCharge,
    totalAmount: detail.totalAmount,
    total_amount: detail.totalAmount,
  };
}

export function getReceiptScheduleProps(detail: TransactionDetailData) {
  return {
    isScheduled: Boolean(detail.isScheduled && detail.scheduledInfo),
    frequency: detail.scheduledInfo?.frequency ?? '',
    nextPurchaseDate: detail.scheduledInfo?.nextPurchaseAt ?? '',
  };
}

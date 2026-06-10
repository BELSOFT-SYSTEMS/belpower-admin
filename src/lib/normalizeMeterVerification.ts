import type {
  MeterElectricityPurchase,
  MeterElectricityPurchaseUser,
  MeterVerificationPayload,
  MeterVerifyResult,
} from '@/types/meterVerification';

type RawRecord = Record<string, unknown>;

function pick<T>(raw: RawRecord, camel: string, snake: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[snake] !== undefined && raw[snake] !== null) return raw[snake] as T;
  return undefined;
}

function pickString(raw: RawRecord, camel: string, snake: string): string {
  const value = pick<string>(raw, camel, snake);
  return value !== undefined && value !== null ? String(value) : '';
}

function pickNumber(raw: RawRecord, camel: string, snake: string, fallback = 0): number {
  const value = pick<number | string>(raw, camel, snake);
  if (value === undefined || value === null || value === '') return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function pickBool(raw: RawRecord, camel: string, snake: string, fallback = false): boolean {
  const value = pick<boolean>(raw, camel, snake);
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeUser(raw: RawRecord | undefined | null): MeterElectricityPurchaseUser | null {
  if (!raw) return null;
  const id = pickString(raw, 'id', 'id');
  if (!id) return null;
  return {
    id,
    email: pickString(raw, 'email', 'email') || null,
    firstName: pickString(raw, 'firstName', 'first_name') || null,
    lastName: pickString(raw, 'lastName', 'last_name') || null,
  };
}

function normalizePurchase(raw: RawRecord): MeterElectricityPurchase {
  const userRaw = pick<RawRecord>(raw, 'user', 'user');
  const amount = pickNumber(raw, 'amount', 'amount');
  const serviceCharge = pickNumber(raw, 'serviceCharge', 'service_charge');
  const vat = pickNumber(raw, 'vat', 'vat');
  const resolvedTotal = pickNumber(raw, 'totalAmount', 'total_amount');

  return {
    id: pickString(raw, 'id', 'id'),
    reference: pickString(raw, 'reference', 'reference'),
    status: pickString(raw, 'status', 'status') || 'pending',
    amount,
    amountPurchased: pickNumber(raw, 'amountPurchased', 'amount_purchased'),
    totalAmount: resolvedTotal ?? amount + serviceCharge + vat,
    serviceCharge,
    vat,
    createdAt: pickString(raw, 'createdAt', 'created_at'),
    completedAt: pickString(raw, 'completedAt', 'completed_at') || null,
    paymentMethod: pickString(raw, 'paymentMethod', 'payment_method') || null,
    user: normalizeUser(userRaw),
    isSuspicious: pickBool(raw, 'isSuspicious', 'is_suspicious'),
    reviewStatus: pickString(raw, 'reviewStatus', 'review_status') || null,
  };
}

function normalizePayload(raw: RawRecord): MeterVerificationPayload {
  return {
    meter_number: pickString(raw, 'meter_number', 'meter_number') || pickString(raw, 'meterNumber', 'meter_number'),
    disco: pickString(raw, 'disco', 'disco').toUpperCase(),
    vend_type: pickString(raw, 'vend_type', 'vend_type') || pickString(raw, 'vendType', 'vend_type'),
    customer_name: pickString(raw, 'customer_name', 'customer_name') || pickString(raw, 'customerName', 'customer_name'),
    address: pickString(raw, 'address', 'address'),
    tariff: pickString(raw, 'tariff', 'tariff') || null,
    tariff_class: pickString(raw, 'tariff_class', 'tariff_class') || pickString(raw, 'tariffClass', 'tariff_class') || null,
    min_vend_amount: pickNumber(raw, 'min_vend_amount', 'min_vend_amount') || pickNumber(raw, 'minVendAmount', 'min_vend_amount'),
    max_vend_amount: pickNumber(raw, 'max_vend_amount', 'max_vend_amount') || pickNumber(raw, 'maxVendAmount', 'max_vend_amount'),
    outstanding: pickNumber(raw, 'outstanding', 'outstanding'),
    debt_repayment: pickNumber(raw, 'debt_repayment', 'debt_repayment') || pickNumber(raw, 'debtRepayment', 'debt_repayment'),
    response_code: pickNumber(raw, 'response_code', 'response_code') || pickNumber(raw, 'responseCode', 'response_code'),
    error: pickBool(raw, 'error', 'error'),
    BeneficiaryName: pickString(raw, 'BeneficiaryName', 'BeneficiaryName') || undefined,
    CustomerAddress: pickString(raw, 'CustomerAddress', 'CustomerAddress') || undefined,
  };
}

export function normalizeMeterVerifyResponse(raw: unknown, message = 'Meter verified'): MeterVerifyResult {
  const source = (raw ?? {}) as RawRecord;

  const verificationRaw = (pick<RawRecord>(source, 'verification', 'verification') ?? {}) as RawRecord;
  const verificationData = (pick<RawRecord>(verificationRaw, 'data', 'data') ?? verificationRaw) as RawRecord;

  const purchasesRaw =
    (pick<unknown[]>(source, 'electricityPurchases', 'electricity_purchases') ?? []) as RawRecord[];

  const payload = normalizePayload(verificationData);
  const meterNumber =
    pickString(source, 'meterNumber', 'meter_number') || payload.meter_number;

  return {
    message,
    meterNumber,
    verificationSuccess: pickBool(verificationRaw, 'success', 'success', true) && !payload.error,
    payload,
    electricityPurchases: purchasesRaw
      .filter((row) => row && typeof row === 'object')
      .map((row) => normalizePurchase(row)),
    purchaseCount:
      pickNumber(source, 'purchaseCount', 'purchase_count') || purchasesRaw.length,
  };
}

export type MeterVerificationPayload = {
  meter_number: string;
  disco: string;
  vend_type: string;
  customer_name: string;
  address: string;
  tariff: string | null;
  tariff_class: string | null;
  min_vend_amount: number;
  max_vend_amount: number;
  outstanding: number;
  debt_repayment: number;
  response_code: number;
  error: boolean;
  BeneficiaryName?: string;
  CustomerAddress?: string;
};

export type MeterElectricityPurchaseUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type MeterElectricityPurchase = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  amountPurchased?: number | null;
  totalAmount: number;
  serviceCharge?: number;
  vat?: number;
  createdAt: string;
  completedAt?: string | null;
  paymentMethod?: string | null;
  user?: MeterElectricityPurchaseUser | null;
  isSuspicious?: boolean;
  reviewStatus?: string | null;
};

/** Normalized result for Check Meter page (POST /admin/meters/verify). */
export type MeterVerifyResult = {
  message: string;
  meterNumber: string;
  verificationSuccess: boolean;
  payload: MeterVerificationPayload;
  electricityPurchases: MeterElectricityPurchase[];
  purchaseCount: number;
};

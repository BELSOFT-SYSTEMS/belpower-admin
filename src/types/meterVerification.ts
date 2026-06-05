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

export type MeterVerificationResult = {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    data: MeterVerificationPayload;
    verification_id: string;
    expires_at: string;
  };
};

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  email: string;
  phone: string;
  address: string | null;
  meter_number: string;
  language: string;
  status: string;
  last_login_at: string;
  last_suspended_at: string | null;
  last_activated_at: string | null;
  last_blocked_at: string | null;
  deleted_at: string | null;
  agreed_to_terms: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  verification_token: string | null;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string | null;
  reset_token: string | null;
  reset_token_expires: null;
  last_password_reset: null;
  failed_login_attempts: number;
  lock_until: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

// Wallet and primary meter data from login response
export interface WalletData {
  balance: number;
  currency: string;
  last_updated?: string;
}

export interface PrimaryMeterData {
  id: string;
  meter_number: string;
  disco: string;
  meter_type: string;
  customer_name: string;
  customer_address: string;
  tariff: string;
  tariff_class: string;
  min_vend_amount: string;
  max_vend_amount: string;
  is_active: boolean;
}

export interface ScheduledTransaction {
  id: string;
  reference: string;
  amount: number;
  service: string;
  scheduled_at: string;
  status: string;
  schedule_info: {
    id: string;
    frequency: string;
    next_payment_date: string;
    status: string;
  };
}

export interface AuthUser extends User {
  wallet?: WalletData;
  primary_meter?: PrimaryMeterData;
  scheduled_transactions?: ScheduledTransaction[];
  saved_meters?: PrimaryMeterData[];
}

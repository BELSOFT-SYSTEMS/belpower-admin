export interface Transaction {
  id: string;
  reference: string;
  order_id: string;
  receipt_number: string;
  type: string; // "debit" or "credit"
  status: string; // "failed", "pending", "scheduled", "completed"
  payment_method: string; // "wallet", "card", etc.
  payment_type: string; // "WALLET", "CARD", etc.
  amount_paid: number;
  service_charge: number;
  discount: number;
  total_amount: number;
  created_at: string; // Transaction creation date
  completed_at: string | null; // Transaction completion date (can be null)
  is_scheduled: boolean;
  scheduled_info: null | {
    frequency: string; // "weekly", "biweekly", "monthly"
    next_purchase: string; // ISO date string
  };

  // Service information
  service: string; // "Airtime", "Data", "Unknown", etc.
  provider: string; // "MTN", "Unknown", etc.

  // Service-specific fields (will vary by service type)
  meter_number?: string;
  amount_before_vat?: number;
  vat?: number;
  units?: number;
  token?: string;
  address?: string;
  customer_name?: string;
  phone_number?: string;
  data_plan?: string;
  bouquet?: string;
  smartcard_number?: string;
  plan_code?: string;
  package_name?: string;
  bundleSize?: string;
  description?: string;
  status_code?: number | string;
  metadata?: {
    provider?: string;
    package?: string;
    smartCardNumber?: string;
    phone?: string;
    network?: string;
    disco?: string;
    breakdown?: {
      user_paid?: string | number;
      total_amount?: string | number;
      tax?: string | number;
    };
    tariffClass?: string;
    electricity_results?: {
      name?: string;
      address?: string;
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      tax?: number;
      data?: {
        name?: string;
        address?: string;
        amountGenerated?: number;
        tax?: number;
        token?: string;
        units?: string | number;
      };
    };
    electricity_data?: {
      name?: string;
      address?: string;
      phone?: string;
      disco?: string;
      meter?: string;
      total_amount?: number;
    };
    buyPower_response?: {
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      total_amount?: number;
      dataBundle?: string;
      data?: {
        name?: string;
        address?: string;
        amountGenerated?: number;
        tax?: number;
        token?: string;
        units?: string | number;
      };
    };
    cable_data?: {
      provider?: string;
      packageName?: string;
      package?: string;
      smartCardNumber?: string;
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      tariffClass?: string;
      amount?: number;
      smartcard_number?: string;
      customer_name?: string;
      total_amount?: number;
    };
    dataBundle?: string;
    meter?: string;
    isScheduled?: boolean;
    frequency?: string;
    nextPurchaseDate?: string;
    vendType?: string;
  };

  // User information
  fullName: string;
  email: string;
  phoneNumber: string;

  // Potential dynamic backend objects
  data?: {
    data?: {
      name?: string;
      address?: string;
      token?: string;
    };
  };
  customer?: {
    name?: string;
  };
  electricity?: {
    customer_name?: string;
    token?: string;
  };
  user_paid?: string | number;

  // Additional fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type TransactionType = 'airtime' | 'data' | 'electricity' | 'cable' | 'deposit' | 'unknown';
export type TransactionStatus = 'failed' | 'pending' | 'scheduled' | 'completed';

export interface FormattedTransaction {
  id: string;
  type: TransactionType;
  service: string;
  provider: string;
  amount: number;
  status: TransactionStatus;
  date: string;
  created_at: string;
  completed_at: string | null;
  phoneNumber?: string;
  meterNumber?: string;
  token?: string;
  dataPlan?: string;
  bouquet?: string;
  smartcardNumber?: string;
  paymentMethod?: string;
  paymentType?: string;
  fullName?: string;
  email?: string;
  address?: string;
  reference: string;
  order_id: string;
  receipt_number: string;
  service_charge: number;
  discount: number;
  total_amount: number;
  is_scheduled: boolean;
  scheduled_info?: {
    frequency: string;
    nextPurchaseDate: string;
  };
  title: string;
  icon: string;
}

export interface TransactionHistoryResponse {
  success: boolean;
  message?: string;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  message?: string;
  data: {
    transaction: Transaction;
  };
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: string; // No longer limited to specific values
  service?: string; // No longer limited to specific values
  startDate?: string;
  endDate?: string;
}

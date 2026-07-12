export type MaintenanceServices = {
  airtime: boolean;
  data: boolean;
  electricity: boolean;
  cable: boolean;
  betting: boolean;
};

export type MaintenanceState = {
  userLogin: boolean;
  userPurchase: boolean;
  walletFunding: boolean;
  paystackDva: boolean;
  buyPowerDva: boolean;
  services: MaintenanceServices;
};

export type MaintenancePatch = {
  userLogin?: boolean;
  userPurchase?: boolean;
  walletFunding?: boolean;
  paystackDva?: boolean;
  buyPowerDva?: boolean;
  services?: Partial<MaintenanceServices>;
};

export type MaintenanceToggleKey =
  | 'stop_login'
  | 'stop_all_purchases'
  | 'stop_wallet_funding'
  | 'stop_paystack_dva'
  | 'stop_buypower_dva'
  | 'stop_airtime'
  | 'stop_data'
  | 'stop_electricity'
  | 'stop_cable'
  | 'stop_betting';

import { getDiscoDisplayName } from '@/constants/discoNames';
import { getTransactionIcon, getProviderDisplayName } from '@/utils/transactionIcons';
import type { AdminPurchaseService } from '@/lib/adminUserPurchases';

export type NetworkOption = {
  code: string;
  label: string;
  logo: string;
};

export const NETWORKS: NetworkOption[] = [
  { code: 'MTN', label: 'MTN', logo: '/mtn.svg' },
  { code: 'AIRTEL', label: 'Airtel', logo: '/airtel.svg' },
  { code: 'GLO', label: 'Glo', logo: '/glo.svg' },
  { code: '9MOBILE', label: '9mobile', logo: '/9mobile.svg' },
];

export const AIRTIME_AMOUNTS = [100, 200, 500, 1000, 2000, 5000, 10000];
export const ELECTRICITY_AMOUNTS = [1000, 2000, 3000, 5000, 7000, 10000];
export const CABLE_PROVIDERS = ['GOTV', 'DSTV', 'STARTIMES'] as const;

export type DataBundle = {
  size: string;
  price: number;
  code?: string;
  tariffClass?: string;
};

export type DataBundleCategory = {
  category: string;
  bundles: DataBundle[];
};

export type CablePackage = {
  name: string;
  price: number;
  code: string;
  tariffClass?: string;
};

export type CablePackageCategory = {
  category: string;
  packages: CablePackage[];
};

export type PurchaseDraft = {
  service: AdminPurchaseService;
  network?: string;
  phone?: string;
  amount?: number;
  bundleLabel?: string;
  planId?: string;
  tariffClass?: string;
  disco?: string;
  meter?: string;
  electricityType?: string;
  customerName?: string;
  address?: string;
  provider?: string;
  smartcard?: string;
  packageName?: string;
  packageCode?: string;
  adminNote?: string;
};

export function getServiceTitle(service: AdminPurchaseService): string {
  const titles: Record<AdminPurchaseService, string> = {
    airtime: 'Airtime',
    data: 'Data Bundle',
    electricity: 'Electricity',
    cable: 'Cable TV',
  };
  return titles[service];
}

export function getConfirmTitle(service: AdminPurchaseService): string {
  const titles: Record<AdminPurchaseService, string> = {
    airtime: 'Confirm Airtime',
    data: 'Confirm Data Bundle',
    electricity: 'Confirm Electricity',
    cable: 'Confirm Cable TV Details',
  };
  return titles[service];
}

export function getNetworkLogo(network: string): string {
  return getTransactionIcon({ type: 'airtime', provider: network });
}

export function getDiscoLogo(code: string): string {
  return getTransactionIcon({ type: 'electricity', provider: code });
}

export function getCableProviderDetails(code: string): { name: string; logo: string } {
  const providers: Record<string, { name: string; logo: string }> = {
    gotv: { name: 'GOtv', logo: '/gotv.jpg' },
    dstv: { name: 'DStv', logo: '/dstv.svg' },
    startimes: { name: 'Startimes', logo: '/startimes.svg' },
  };
  return providers[code.toLowerCase()] || { name: code, logo: '/Tv.png' };
}

export function getServiceCharge(service: AdminPurchaseService): number {
  return service === 'electricity' || service === 'cable' ? 100 : 0;
}

export function getPurchaseAmount(draft: PurchaseDraft): number {
  return draft.amount ?? 0;
}

export function getTotalDebit(draft: PurchaseDraft): number {
  return getPurchaseAmount(draft) + getServiceCharge(draft.service);
}

export function extractCatalogPlanList(raw: unknown): unknown[] {
  if (!raw || typeof raw !== 'object') return [];

  const root = raw as Record<string, unknown>;
  const envelope = (root.data && typeof root.data === 'object' ? root.data : root) as Record<
    string,
    unknown
  >;

  const candidates = [envelope.plans, root.plans, envelope.data, root.data, envelope, root];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object' && 'data' in candidate) {
      const nested = (candidate as { data?: unknown }).data;
      if (Array.isArray(nested)) return nested;
    }
  }

  return [];
}

export function parseRawPlans(raw: unknown): DataBundle[] {
  const list = extractCatalogPlanList(raw);

  return list
    .map((item) => {
      const plan = item as Record<string, unknown>;
      const price = Number(plan.price ?? plan.amount ?? plan.value ?? 0);
      const size = String(plan.desc ?? plan.name ?? plan.description ?? plan.planName ?? price);
      const code = plan.code ? String(plan.code) : undefined;
      const tariffClass = String(plan.tariffClass ?? plan.code ?? 'STANDARD');
      if (!Number.isFinite(price) || price <= 0) return null;
      return { size, price, code, tariffClass };
    })
    .filter(Boolean) as DataBundle[];
}

export function groupDataBundles(plans: DataBundle[]): DataBundleCategory[] {
  const grouped: DataBundleCategory[] = [];

  plans.forEach((plan) => {
    const desc = plan.size.toLowerCase();
    let category = 'Other';

    if (desc.includes('1 day') || desc.includes('1day') || desc.includes('daily')) {
      category = 'Daily';
    } else if (desc.includes('2 day') || desc.includes('2days')) {
      category = 'Daily';
    } else if (desc.includes('7 day') || desc.includes('7days') || desc.includes('weekly')) {
      category = 'Weekly';
    } else if (desc.includes('14 day') || desc.includes('14days')) {
      category = 'Weekly';
    } else if (
      desc.includes('30 day') ||
      desc.includes('30days') ||
      desc.includes('1 month') ||
      desc.includes('monthly')
    ) {
      category = 'Monthly';
    } else if (desc.includes('2 month') || desc.includes('2months') || desc.includes('60 day')) {
      category = '2-Months';
    } else if (desc.includes('3 month') || desc.includes('3months') || desc.includes('90 day')) {
      category = '3-Months';
    } else if (desc.includes('yearly') || desc.includes('365 day')) {
      category = 'Yearly';
    }

    const existing = grouped.find((item) => item.category === category);
    if (existing) {
      existing.bundles.push(plan);
    } else {
      grouped.push({ category, bundles: [plan] });
    }
  });

  if (grouped.length === 0 && plans.length > 0) {
    return [{ category: 'Plans', bundles: plans }];
  }

  return grouped.filter((item) => item.bundles.length > 0);
}

export function groupCablePackages(
  provider: string,
  plans: CablePackage[]
): { flat: CablePackage[]; grouped: CablePackageCategory[] } {
  if (provider === 'DSTV') {
    const compactPlusPackages = plans.filter((plan) => plan.name.includes('Compact Plus'));
    const compactPackages = plans.filter(
      (plan) => plan.name.includes('Compact') && !plan.name.includes('Plus')
    );
    const otherCategories = [
      { name: 'DSTV Padi', keyword: 'Padi' },
      { name: 'DSTV Yanga', keyword: 'Yanga' },
      { name: 'DSTV Confam', keyword: 'Confam' },
      { name: 'DSTV Premium', keyword: 'Premium' },
    ];

    const grouped = [
      { category: 'DSTV Compact Plus', packages: compactPlusPackages },
      { category: 'DSTV Compact', packages: compactPackages },
      ...otherCategories.map((category) => ({
        category: category.name,
        packages: plans.filter((plan) => plan.name.includes(category.keyword)),
      })),
    ].filter((group) => group.packages.length > 0);

    return { flat: plans, grouped };
  }

  if (provider === 'STARTIMES') {
    const grouped = [
      { category: 'Basic', packages: plans.filter((plan) => plan.name.includes('Basic')) },
      { category: 'Nova', packages: plans.filter((plan) => plan.name.includes('Nova')) },
      { category: 'Smart', packages: plans.filter((plan) => plan.name.includes('Smart')) },
      { category: 'Classic', packages: plans.filter((plan) => plan.name.includes('Classic')) },
      { category: 'Super', packages: plans.filter((plan) => plan.name.includes('Super')) },
    ].filter((group) => group.packages.length > 0);

    return { flat: plans, grouped };
  }

  return { flat: plans, grouped: [] };
}

export function buildPurchasePayload(
  draft: PurchaseDraft,
  userEmail?: string | null,
  userContext?: { phone?: string | null; name?: string | null }
): Record<string, unknown> {
  const normalizedPhone = userContext?.phone
    ? userContext.phone.replace(/^\+234/, '0').replace(/\D/g, '')
    : '';
  const userName = userContext?.name?.trim() || '';

  const base = {
    paymentType: 'wallet',
    email: userEmail || '',
    adminNote: draft.adminNote?.trim() || undefined,
    phone: normalizedPhone || undefined,
    name: userName || undefined,
  };

  if (draft.service === 'airtime') {
    return {
      ...base,
      disco: draft.network,
      phone: draft.phone,
      meter: draft.phone,
      amount: draft.amount,
      vertical: 'VTU',
      vendType: 'PREPAID',
    };
  }

  if (draft.service === 'data') {
    return {
      ...base,
      disco: draft.network,
      phone: draft.phone,
      meter: draft.phone,
      amount: draft.amount,
      vertical: 'DATA',
      vendType: 'PREPAID',
      dataBundle: draft.bundleLabel,
      tariffClass: draft.planId || draft.tariffClass || 'STANDARD',
    };
  }

  if (draft.service === 'electricity') {
    return {
      ...base,
      disco: draft.disco?.toUpperCase(),
      meter: draft.meter,
      amount: draft.amount,
      service_charge: getServiceCharge('electricity'),
      vertical: 'ELECTRICITY',
      vendType: draft.electricityType?.toUpperCase() === 'POSTPAID' ? 'POSTPAID' : 'PREPAID',
      name: draft.customerName || userName || undefined,
    };
  }

  return {
    ...base,
    disco: draft.provider,
    meter: draft.smartcard,
    amount: draft.amount,
    serviceCharge: getServiceCharge('cable'),
    tariffClass: draft.packageCode || draft.tariffClass,
    packageName: draft.packageName,
    vertical: 'TV',
    vendType: 'PREPAID',
  };
}

export function getProviderLabel(service: AdminPurchaseService, draft: PurchaseDraft): string {
  if (service === 'airtime' || service === 'data') {
    return getProviderDisplayName(draft.network || '');
  }
  if (service === 'electricity') {
    return getDiscoDisplayName(draft.disco || '');
  }
  return getCableProviderDetails(draft.provider || '').name;
}

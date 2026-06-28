/**
 * Transaction / provider icons — ported from belpower-frontend iconUtils
 */

import { getDiscoLogoPath } from '@/utils/discoLogoMap';

export type TransactionIconInput = {
  type: string;
  provider?: string;
  service?: string;
  cashback_source_type?: string | null;
};

export function getTransactionIcon(transaction: TransactionIconInput): string {
  const type = (transaction.type || transaction.service || '').toLowerCase();

  if (type === 'cashback') {
    const source = (transaction.cashback_source_type || '').toLowerCase();
    if (source === 'airtime') return '/airtime.png';
    if (source === 'data') return '/data.png';
    return '/wallet.png';
  }

  if (type === 'deposit' || type === 'wallet' || type === 'refund') {
    return '/wallet.png';
  }

  if (['airtime', 'data'].includes(type)) {
    const providerLower = (transaction.provider || '').toLowerCase();
    const providerMap: Record<string, string> = {
      mtn: '/mtn.svg',
      airtel: '/airtel.svg',
      glo: '/glo.svg',
      '9mobile': '/9mobile.svg',
      etisalat: '/9mobile.svg',
    };
    return providerMap[providerLower] || `/${providerLower}.svg`;
  }

  if (type === 'cable' || type.includes('cable')) {
    const providerLower = (transaction.provider || '').toLowerCase();
    const cableMap: Record<string, string> = {
      dstv: '/dstv.svg',
      gotv: '/gotv.jpg',
      startimes: '/startimes.svg',
      showmax: '/showmax.png',
    };
    return cableMap[providerLower] || '/Tv.png';
  }

  if (type === 'electricity') {
    return getDiscoLogoPath(transaction.provider || '');
  }

  const typeMap: Record<string, string> = {
    airtime: '/airtime.png',
    data: '/data.png',
    cable: '/Tv.png',
    electricity: '/electricity.png',
  };
  return typeMap[type] || '/electricity.png';
}

export function getProviderDisplayName(provider: string): string {
  const map: Record<string, string> = {
    mtn: 'MTN',
    airtel: 'Airtel',
    glo: 'GLO',
    '9mobile': '9Mobile',
    dstv: 'DStv',
    gotv: 'GOtv',
    startimes: 'StarTimes',
    ikedc: 'IKEDC',
    ekedc: 'EKEDC',
    aedc: 'AEDC',
    ibedc: 'IBEDC',
    phed: 'PHED',
    phedc: 'PHED',
    kaedc: 'KAEDC',
    bedc: 'BEDC',
    eedc: 'EEDC',
    jedc: 'JEDC',
    kedco: 'KEDCO',
    yedc: 'YEDC',
  };
  return map[provider?.toLowerCase()] ?? provider?.toUpperCase() ?? 'N/A';
}

export function getDiscoIcon(discoCode: string): string {
  return getTransactionIcon({
    type: 'electricity',
    provider: discoCode,
  });
}

/** Provider logo for receipt PDF header — matches belpower-frontend iconUtils */
export function getProviderLogo(provider: string, type: string): string {
  return getTransactionIcon({ type, provider });
}

export function getTransactionIconFallback(type: string): string {
  if (type === 'deposit' || type === 'refund' || type === 'cashback') return '/wallet.png';
  if (type === 'electricity') return '/electricity.png';
  if (['airtime', 'data'].includes(type)) return `/${type}.png`;
  return '/electricity.png';
}

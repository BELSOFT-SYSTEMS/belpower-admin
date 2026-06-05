/**
 * Transaction / provider icons — ported from belpower-frontend iconUtils
 */

export type TransactionIconInput = {
  type: string;
  provider?: string;
  service?: string;
};

export function getTransactionIcon(transaction: TransactionIconInput): string {
  const type = (transaction.type || transaction.service || '').toLowerCase();

  if (type === 'deposit' || type === 'wallet') return '/wallet.png';

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
    };
    return cableMap[providerLower] || '/Tv.png';
  }

  if (type === 'electricity') {
    const providerLower = (transaction.provider || '').toLowerCase();
    const discoMap: Record<string, string> = {
      aedc: '/aedc.png',
      abuja: '/aedc.png',
      ekedc: '/ekedc.png',
      eko: '/ekedc.png',
      ikedc: '/ikedc.png',
      ikeja: '/ikedc.png',
      ibedc: '/ibedc.png',
      ibadan: '/ibedc.png',
      enugu: '/eedc.png',
      eedc: '/eedc.png',
      jos: '/jedc.png',
      jedc: '/jedc.png',
      kaduna: '/kaedc.png',
      kaedc: '/kaedc.png',
      kaedco: '/kaedc.png',
      kano: '/kedc.png',
      kedco: '/kedc.png',
      ph: '/phedc.jpeg',
      phedc: '/phedc.jpeg',
      phed: '/phedc.jpeg',
      benin: '/bedc.png',
      bedc: '/bedc.png',
      yola: '/yedc.png',
      yedc: '/yedc.png',
    };
    return discoMap[providerLower] || '/electricity.png';
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
  };
  return map[provider?.toLowerCase()] ?? provider?.toUpperCase() ?? 'N/A';
}

export function getDiscoIcon(discoCode: string): string {
  return getTransactionIcon({
    type: 'electricity',
    provider: discoCode,
  });
}

export function getTransactionIconFallback(type: string): string {
  if (type === 'deposit') return '/wallet.png';
  if (type === 'electricity') return '/electricity.png';
  if (['airtime', 'data'].includes(type)) return `/${type}.png`;
  return '/electricity.png';
}

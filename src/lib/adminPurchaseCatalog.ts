import { ADMIN_API_BASE, adminHeaders, AuthApiError } from '@/lib/adminAuth';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

async function parseCatalog<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new AuthApiError(body.message ?? fallback);
  }
  return (body.data ?? body) as T;
}

export async function fetchDataPlans(network: string) {
  const res = await fetch(
    `${ADMIN_API_BASE}/purchases/catalog/data-plans?network=${encodeURIComponent(network)}`,
    { headers: adminHeaders(), cache: 'no-store' }
  );
  return parseCatalog<{ provider: string; plans: unknown[] }>(res, 'Failed to load data plans');
}

export async function fetchCablePlans(provider: string) {
  const res = await fetch(
    `${ADMIN_API_BASE}/purchases/catalog/cable-plans?provider=${encodeURIComponent(provider)}`,
    { headers: adminHeaders(), cache: 'no-store' }
  );
  return parseCatalog<{ provider: string; plans: unknown[] }>(res, 'Failed to load cable plans');
}

export async function fetchElectricityDiscos() {
  const res = await fetch(`${ADMIN_API_BASE}/purchases/catalog/discos/electricity`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseCatalog<unknown>(res, 'Failed to load electricity discos');
}

export async function fetchNetworkProviders() {
  const res = await fetch(`${ADMIN_API_BASE}/purchases/catalog/discos/network`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseCatalog<unknown>(res, 'Failed to load network providers');
}

export async function fetchCableProviders() {
  const res = await fetch(`${ADMIN_API_BASE}/purchases/catalog/discos/cable`, {
    headers: adminHeaders(),
    cache: 'no-store',
  });
  return parseCatalog<unknown>(res, 'Failed to load cable providers');
}

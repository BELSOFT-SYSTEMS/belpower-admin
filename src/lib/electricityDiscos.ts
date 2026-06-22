import { DISCO_NAMES, getDiscoDisplayName } from '@/constants/discoNames';
import { ADMIN_API_BASE, adminHeaders } from '@/lib/adminAuth';
import type { ElectricityDisco, ElectricityDiscosApiResponse } from '@/types/electricityDiscos';

export function mapPowerDiscosRecord(data: Record<string, boolean>): ElectricityDisco[] {
  return Object.entries(data)
    .map(([code, available]) => ({
      code: code.toUpperCase(),
      name: getDiscoDisplayName(code),
      available: available === true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function mapPowerDiscosResponse(payload: ElectricityDiscosApiResponse): ElectricityDisco[] {
  const { data } = payload;
  if (!data) return [];

  if (Array.isArray(data)) {
    return data
      .map((item) => ({
        code: item.code.toUpperCase(),
        name: item.name || getDiscoDisplayName(item.code),
        available: item.available !== false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return mapPowerDiscosRecord(data);
}

export function fallbackElectricityDiscos(): ElectricityDisco[] {
  return Object.keys(DISCO_NAMES)
    .map((code) => ({
      code,
      name: DISCO_NAMES[code],
      available: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function toDiscoDropdownOptions(
  discos: ElectricityDisco[],
  placeholder = 'Select disco'
): { value: string; label: string }[] {
  return [
    { value: '', label: placeholder },
    ...discos.map((disco) => ({
      value: disco.code,
      label: disco.available ? disco.name : `${disco.name} (Service Unavailable)`,
    })),
  ];
}

async function fetchElectricityDiscosFromAdminCatalog(): Promise<ElectricityDisco[] | null> {
  try {
    const response = await fetch(`${ADMIN_API_BASE}/purchases/catalog/discos/electricity`, {
      method: 'GET',
      headers: {
        ...adminHeaders(),
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const payload = (await response.json()) as ElectricityDiscosApiResponse;

    if (!response.ok || payload.success === false || !payload.data) {
      return null;
    }

    const discos = mapPowerDiscosResponse(payload);
    return discos.length > 0 ? discos : null;
  } catch {
    return null;
  }
}

async function fetchElectricityDiscosFromGuestRoute(): Promise<ElectricityDisco[]> {
  const response = await fetch('/api/bills/electricity/discos', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const payload = (await response.json()) as ElectricityDiscosApiResponse;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? 'Failed to load electricity discos');
  }

  const discos = mapPowerDiscosResponse(payload);
  if (discos.length === 0) {
    return fallbackElectricityDiscos();
  }

  return discos;
}

export async function fetchElectricityDiscos(): Promise<ElectricityDisco[]> {
  const adminDiscos = await fetchElectricityDiscosFromAdminCatalog();
  if (adminDiscos && adminDiscos.length > 0) {
    return adminDiscos;
  }

  return fetchElectricityDiscosFromGuestRoute();
}

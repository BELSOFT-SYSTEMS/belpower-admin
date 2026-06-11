/** Ephemeral fallback when the backend demo-mode endpoint is not available yet. */

const LOCAL_DEMO_MODE_API = '/api/admin/demo-mode';

export type DemoModeState = {
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string | null;
};

export async function getLocalDemoModeState(): Promise<DemoModeState> {
  const res = await fetch(LOCAL_DEMO_MODE_API, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load local demo mode state');
  }

  const body = (await res.json()) as { enabled?: boolean; updatedAt?: string; updatedBy?: string };
  return {
    enabled: Boolean(body.enabled),
    updatedAt: body.updatedAt ?? new Date().toISOString(),
    updatedBy: body.updatedBy ?? null,
  };
}

export async function setLocalDemoModeState(enabled: boolean): Promise<DemoModeState> {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('adminToken') ??
        window.sessionStorage.getItem('adminToken')
      : null;

  const res = await fetch(LOCAL_DEMO_MODE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ enabled }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Failed to update local demo mode state');
  }

  const body = (await res.json()) as { enabled?: boolean; updatedAt?: string; updatedBy?: string };
  return {
    enabled: Boolean(body.enabled),
    updatedAt: body.updatedAt ?? new Date().toISOString(),
    updatedBy: body.updatedBy ?? null,
  };
}

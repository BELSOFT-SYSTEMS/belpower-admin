/** Runtime demo mode — toggled by super admin, synced across all sessions via API. */

const DEMO_MODE_API = '/api/admin/demo-mode';
const POLL_MS = 15_000;

type DemoModeListener = (enabled: boolean) => void;

let enabled = false;
let initialized = false;
let pollTimer: number | null = null;
const listeners = new Set<DemoModeListener>();

function notify() {
  listeners.forEach((listener) => listener(enabled));
}

export function getAdminDemoMode(): boolean {
  return enabled;
}

export function subscribeAdminDemoMode(listener: DemoModeListener): () => void {
  listeners.add(listener);
  listener(enabled);
  return () => listeners.delete(listener);
}

export async function fetchAdminDemoMode(): Promise<boolean> {
  try {
    const res = await fetch(DEMO_MODE_API, { cache: 'no-store' });
    if (!res.ok) return enabled;
    const body = (await res.json()) as { enabled?: boolean };
    return Boolean(body.enabled);
  } catch {
    return enabled;
  }
}

export async function syncAdminDemoMode(): Promise<boolean> {
  const next = await fetchAdminDemoMode();
  if (next !== enabled) {
    enabled = next;
    notify();
  }
  return enabled;
}

export async function setAdminDemoMode(next: boolean): Promise<boolean> {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('adminToken') : null;

  const res = await fetch(DEMO_MODE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ enabled: next }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Failed to update demo mode');
  }

  const body = (await res.json()) as { enabled?: boolean };
  enabled = Boolean(body.enabled);
  notify();
  return enabled;
}

export function startAdminDemoModePolling(): void {
  if (typeof window === 'undefined' || pollTimer) return;

  void syncAdminDemoMode();

  pollTimer = window.setInterval(() => {
    void syncAdminDemoMode();
  }, POLL_MS);
}

export function stopAdminDemoModePolling(): void {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function initAdminDemoMode(initial: boolean): void {
  if (initialized) return;
  enabled = initial;
  initialized = true;
  notify();
}

export function isSuperAdminProfile(
  admin: { role?: string; allAccess?: boolean } | null | undefined
): boolean {
  if (!admin) return false;
  return Boolean(admin.allAccess || admin.role === 'super_admin');
}

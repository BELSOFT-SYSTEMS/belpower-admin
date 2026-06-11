/** Runtime demo mode — persisted on the backend; local route is a temporary fallback. */

import {
  getBackendDemoModeState,
  hasDemoModeAuthToken,
  isDemoModeBackendMissing,
  patchBackendDemoModeState,
} from '@/lib/adminDemoModeApi';
import { getLocalDemoModeState, setLocalDemoModeState } from '@/lib/adminDemoModeLocal';

const POLL_MS = 15_000;

type DemoModeListener = (enabled: boolean) => void;

let enabled = false;
let initialized = false;
let usingBackend = true;
let pollTimer: number | null = null;
const listeners = new Set<DemoModeListener>();

function notify() {
  listeners.forEach((listener) => listener(enabled));
}

async function loadDemoModeState(): Promise<boolean> {
  if (hasDemoModeAuthToken()) {
    try {
      const state = await getBackendDemoModeState();
      usingBackend = true;
      return state.enabled;
    } catch (error) {
      if (!isDemoModeBackendMissing(error)) {
        console.warn('Demo mode backend read failed; keeping current state.', error);
        return enabled;
      }
      usingBackend = false;
    }
  }

  try {
    const state = await getLocalDemoModeState();
    return state.enabled;
  } catch (error) {
    console.warn('Demo mode local fallback read failed; keeping current state.', error);
    return enabled;
  }
}

async function saveDemoModeState(next: boolean): Promise<boolean> {
  if (hasDemoModeAuthToken()) {
    try {
      const state = await patchBackendDemoModeState(next);
      usingBackend = true;
      return state.enabled;
    } catch (error) {
      if (!isDemoModeBackendMissing(error)) {
        throw error;
      }
      usingBackend = false;
    }
  }

  const state = await setLocalDemoModeState(next);
  return state.enabled;
}

export function getAdminDemoMode(): boolean {
  return enabled;
}

export function isAdminDemoModeUsingBackend(): boolean {
  return usingBackend;
}

export function subscribeAdminDemoMode(listener: DemoModeListener): () => void {
  listeners.add(listener);
  listener(enabled);
  return () => listeners.delete(listener);
}

export async function fetchAdminDemoMode(): Promise<boolean> {
  return loadDemoModeState();
}

export async function syncAdminDemoMode(): Promise<boolean> {
  const next = await loadDemoModeState();
  if (next !== enabled) {
    enabled = next;
    notify();
  }
  return enabled;
}

export async function setAdminDemoMode(next: boolean): Promise<boolean> {
  const saved = await saveDemoModeState(next);
  enabled = saved;
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

import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const BACKEND_BASE =
  process.env.ADMIN_API_URL ?? 'https://api.belpower.ng/api/v1/admin';

type DemoModePayload = {
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string;
};

const memoryState: DemoModePayload = {
  enabled: process.env.ADMIN_DEMO_MODE_DEFAULT === 'true',
  updatedAt: new Date().toISOString(),
};

function demoModeFilePath(): string {
  return path.join(os.tmpdir(), 'belpower-admin-demo-mode.json');
}

async function readLocalDemoMode(): Promise<DemoModePayload> {
  try {
    const raw = await fs.readFile(demoModeFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as DemoModePayload;
    if (typeof parsed.enabled === 'boolean') {
      memoryState.enabled = parsed.enabled;
      memoryState.updatedAt = parsed.updatedAt ?? memoryState.updatedAt;
      memoryState.updatedBy = parsed.updatedBy;
    }
  } catch {
    // Use in-memory default.
  }

  return memoryState;
}

async function writeLocalDemoMode(payload: DemoModePayload): Promise<void> {
  memoryState.enabled = payload.enabled;
  memoryState.updatedAt = payload.updatedAt;
  memoryState.updatedBy = payload.updatedBy;

  try {
    await fs.writeFile(demoModeFilePath(), JSON.stringify(payload), 'utf8');
  } catch {
    // In-memory only when filesystem is unavailable.
  }
}

function extractToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token || null;
}

function isSuperAdminToken(request: NextRequest): boolean {
  const token = extractToken(request);
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload) return false;

  return payload.role === 'super_admin';
}

function normalizeBackendState(raw: Record<string, unknown> | undefined): DemoModePayload {
  return {
    enabled: Boolean(raw?.enabled),
    updatedAt:
      typeof raw?.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    updatedBy: typeof raw?.updatedBy === 'string' ? raw.updatedBy : undefined,
  };
}

async function fetchBackendDemoMode(token: string | null): Promise<DemoModePayload | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/system/demo-mode`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const body = (await res.json()) as {
      data?: { demoMode?: Record<string, unknown> };
    };

    return normalizeBackendState(body.data?.demoMode);
  } catch {
    return null;
  }
}

async function patchBackendDemoMode(
  enabled: boolean,
  token: string,
  updatedBy?: string
): Promise<DemoModePayload | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/system/demo-mode`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled }),
      cache: 'no-store',
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const body = (await res.json()) as {
      data?: { state?: Record<string, unknown> };
    };

    const state = normalizeBackendState(body.data?.state);
    if (updatedBy) state.updatedBy = updatedBy;
    return state;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = extractToken(request);
  const backendState = await fetchBackendDemoMode(token);

  if (backendState) {
    return NextResponse.json({
      enabled: backendState.enabled,
      updatedAt: backendState.updatedAt,
      source: 'backend',
    });
  }

  const localState = await readLocalDemoMode();
  return NextResponse.json({
    enabled: localState.enabled,
    updatedAt: localState.updatedAt,
    source: 'local',
  });
}

export async function POST(request: NextRequest) {
  if (!isSuperAdminToken(request)) {
    return NextResponse.json(
      { message: 'Only super admins can change demo mode.' },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { enabled?: boolean };
  const enabled = Boolean(body.enabled);
  const token = extractToken(request)!;
  const payload = decodeToken(token);

  const backendState = await patchBackendDemoMode(enabled, token, payload?.email);
  if (backendState) {
    return NextResponse.json({
      enabled: backendState.enabled,
      updatedAt: backendState.updatedAt,
      source: 'backend',
    });
  }

  await writeLocalDemoMode({
    enabled,
    updatedAt: new Date().toISOString(),
    updatedBy: payload?.email,
  });

  return NextResponse.json({
    enabled: memoryState.enabled,
    updatedAt: memoryState.updatedAt,
    source: 'local',
  });
}

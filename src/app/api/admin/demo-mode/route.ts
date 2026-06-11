import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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

async function readDemoMode(): Promise<DemoModePayload> {
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

async function writeDemoMode(payload: DemoModePayload): Promise<void> {
  memoryState.enabled = payload.enabled;
  memoryState.updatedAt = payload.updatedAt;
  memoryState.updatedBy = payload.updatedBy;

  try {
    await fs.writeFile(demoModeFilePath(), JSON.stringify(payload), 'utf8');
  } catch {
    // In-memory only when filesystem is unavailable.
  }
}

function isSuperAdminToken(request: NextRequest): boolean {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload) return false;

  return payload.role === 'super_admin';
}

export async function GET() {
  const state = await readDemoMode();
  return NextResponse.json({ enabled: state.enabled, updatedAt: state.updatedAt });
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
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const payload = token ? decodeToken(token) : null;

  await writeDemoMode({
    enabled,
    updatedAt: new Date().toISOString(),
    updatedBy: payload?.email,
  });

  return NextResponse.json({ enabled, updatedAt: memoryState.updatedAt });
}

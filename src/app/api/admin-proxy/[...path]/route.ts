import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE =
  process.env.ADMIN_API_URL ?? 'https://api.belpower.ng/api/v1/admin';

const PUBLIC_PATH_PREFIXES = ['login', 'complete-setup', 'reset-password'];

function isPublicAdminPath(targetPath: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => targetPath === prefix || targetPath.startsWith(`${prefix}/`)
  );
}

function extractToken(req: NextRequest): string | null {
  const fromHeader = req.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  const fromCookie = req.cookies.get('adminToken')?.value?.trim();
  const token = fromHeader || fromCookie || null;

  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }

  return token;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Admin token required' },
    },
    { status: 401 }
  );
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetPath = path.join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_BASE}/${targetPath}${search}`;
  const isPublic = isPublicAdminPath(targetPath);
  const token = extractToken(req);

  if (!isPublic && !token) {
    return unauthorizedResponse();
  }

  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('content-type') ?? 'application/json');

  const accept = req.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const excludeInternalTest = req.headers.get('x-exclude-internal-test');
  if (excludeInternalTest) {
    headers.set('X-Exclude-Internal-Test', excludeInternalTest);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  try {
    const res = await fetch(targetUrl, {
      ...init,
      cache: 'no-store',
    });
    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  } catch (error) {
    console.error('Admin API proxy error:', { targetUrl, error });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: 'Unable to reach the admin API. Please try again shortly.',
        },
      },
      { status: 502 }
    );
  }
}

export const dynamic = 'force-dynamic';

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;

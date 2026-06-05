import { cookies } from 'next/headers';
import { decodeToken } from './auth';

export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export async function createSession(accessToken: string, refreshToken: string) {
  try {
    console.log('🔹 Storing session tokens in cookies');
    console.log('Access token length:', accessToken.length);
    console.log('Refresh token length:', refreshToken.length);

    if (!accessToken || !refreshToken) throw new Error('Tokens are missing.');

    // Decode tokens to get their expiration times
    const accessTokenPayload = decodeToken(accessToken);
    const refreshTokenPayload = decodeToken(refreshToken);

    console.log('Access token payload:', accessTokenPayload ? 'VALID' : 'INVALID');
    console.log('Refresh token payload:', refreshTokenPayload ? 'VALID' : 'INVALID');

    if (!accessTokenPayload || !refreshTokenPayload) {
      throw new Error('Invalid tokens provided');
    }

    const accessTokenExpires = new Date(accessTokenPayload.exp * 1000);
    const refreshTokenExpires = new Date(refreshTokenPayload.exp * 1000);
    const lastActivity = Date.now();

    console.log('Access token expires:', accessTokenExpires);
    console.log('Refresh token expires:', refreshTokenExpires);

    const cookieStore = await cookies();

    console.log('Setting access token cookie...');
    cookieStore.set({
      name: ACCESS_TOKEN_COOKIE_NAME,
      value: JSON.stringify({
        token: accessToken,
        lastActivity,
        iat: accessTokenPayload.iat,
        exp: accessTokenPayload.exp,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: accessTokenExpires,
    });

    console.log('Access token cookie set successfully');

    console.log('Setting refresh token cookie...');
    cookieStore.set({
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: JSON.stringify({
        token: refreshToken,
        iat: refreshTokenPayload.iat,
        exp: refreshTokenPayload.exp,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: refreshTokenExpires,
    });

    console.log('Refresh token cookie set successfully');

    // Verify cookies were set
    const allCookies = cookieStore.getAll();
    console.log(
      'All cookies after setting:',
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value }))
    );

    console.log('✅ Session stored successfully!');
  } catch (error) {
    console.error('🛑 Error storing session:', error);
    throw new Error('Failed to store session.');
  }
}

export async function deleteSession() {
  console.log('🔹 Deleting session...');
  (await cookies()).delete(ACCESS_TOKEN_COOKIE_NAME);
  (await cookies()).delete(REFRESH_TOKEN_COOKIE_NAME);
  console.log('✅ Session deleted.');

  // Clear client-side cache
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
}

export async function getSession(): Promise<{
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
  lastActivity: number;
  accessTokenExp?: number;
  refreshTokenExp?: number;
} | null> {
  try {
    const accessTokenCookie = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    const refreshTokenCookie = (await cookies()).get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!accessTokenCookie || !refreshTokenCookie) {
      console.log('⚠️ No active session found.');
      return null;
    }

    const accessTokenData = JSON.parse(accessTokenCookie);
    const refreshTokenData = JSON.parse(refreshTokenCookie);

    // Decode the access token to get user info
    const tokenPayload = decodeToken(accessTokenData.token);

    return {
      user: {
        id: tokenPayload?.id || '',
        email: tokenPayload?.email || '',
      },
      accessToken: accessTokenData.token,
      refreshToken: refreshTokenData.token,
      lastActivity: accessTokenData.lastActivity || Date.now(),
      accessTokenExp: accessTokenData.exp,
      refreshTokenExp: refreshTokenData.exp,
    };
  } catch (error) {
    console.error('🛑 Error parsing session data:', error);
    await deleteSession();
    return null;
  }
}

// Remove unused functions or keep them simple
export async function validateActiveSession(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  // Verify token is valid and not expired
  const payload = decodeToken(session.accessToken);
  if (payload) return true;

  // If access token is expired, try to refresh it
  try {
    const newAccessToken = await refreshSession();
    return !!newAccessToken;
  } catch (error) {
    console.error('Session validation failed during refresh:', error);
    return false;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) throw new Error('Backend URL not configured');

    const response = await fetch(`${backendUrl}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.warn('Failed to refresh token from backend:', response.status);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data?.data?.tokens?.accessToken || data?.token || data?.accessToken;
    } else {
      const textData = await response.text();
      console.warn(
        'Backend returned non-JSON response during refresh:',
        textData.substring(0, 100)
      );
      return null;
    }
  } catch (error) {
    console.error('Error in refreshAccessToken:', error);
    return null;
  }
}

export async function refreshSession(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const newAccessToken = await refreshAccessToken(refreshToken);

    if (newAccessToken) {
      await updateAccessToken(newAccessToken);
      return newAccessToken;
    }

    await deleteSession();
    return null;
  } catch (error) {
    console.error('Error in refreshSession:', error);
    return null;
  }
}

async function updateAccessToken(newAccessToken: string) {
  const payload = decodeToken(newAccessToken);
  if (!payload) return;

  const expires = new Date(payload.exp * 1000);
  const cookieStore = await cookies();

  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: JSON.stringify({
      token: newAccessToken,
      lastActivity: Date.now(),
      iat: payload.iat,
      exp: payload.exp,
    }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expires,
  });
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const refreshTokenCookie = (await cookies()).get(REFRESH_TOKEN_COOKIE_NAME)?.value;
    if (!refreshTokenCookie) return null;

    const refreshTokenData = JSON.parse(refreshTokenCookie);
    return refreshTokenData.token;
  } catch (error) {
    console.error('🛑 Error getting refresh token:', error);
    return null;
  }
}

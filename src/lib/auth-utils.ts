import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

interface User {
  email: string;
  role: string;
}

interface AuthResult {
  isAuthenticated: boolean;
  user: User | null;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function verifyAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value || '';

    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Type assertion for the payload
    const userPayload = payload as unknown as User;

    return {
      isAuthenticated: true,
      user: {
        email: userPayload.email,
        role: userPayload.role,
        // Add any other user fields you need
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { isAuthenticated: false, user: null };
  }
}

export async function requireAuth(): Promise<{ user: User }> {
  const { isAuthenticated, user } = await verifyAuth();

  if (!isAuthenticated || !user) {
    throw new Error('Unauthorized');
  }

  return { user };
}

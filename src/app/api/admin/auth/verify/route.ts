import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// In a real app, you would get this from your environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken');

    if (!token) {
      return NextResponse.json(
        { isAuthenticated: false },
        { status: 401 }
      );
    }

    // Verify the token
    try {
      const { payload } = await jwtVerify(token.value, JWT_SECRET);
      
      // In a real app, you might want to:
      // 1. Check if the user still exists in the database
      // 2. Verify their permissions
      // 3. Return user data
      
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          email: payload.email,
          role: payload.role,
        }
      });
      
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear invalid token
      cookieStore.delete('adminToken');
      
      return NextResponse.json(
        { isAuthenticated: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { isAuthenticated: false, message: 'Authentication error' },
      { status: 500 }
    );
  }
}

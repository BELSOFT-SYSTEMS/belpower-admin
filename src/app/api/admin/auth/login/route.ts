import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { z } from 'zod';

// In a real app, you would get this from your environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = loginSchema.parse(body);

    // In a real app, you would:
    // 1. Validate credentials against your database
    // 2. Verify password hash
    // 3. Get user role and permissions

    // For development, accept any email and password
    // In production, you should validate against a database
    console.log('Login attempt with:', { email });

    // Create JWT token
    const token = await new SignJWT({
      email,
      role: 'admin',
      // Add any other user data you want to include
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        email,
        role: 'admin',
      },
    });

    response.cookies.set({
      name: 'adminToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

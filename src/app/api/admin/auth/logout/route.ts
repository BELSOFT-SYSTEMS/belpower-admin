import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the authentication cookie by setting it to expire
    const response = NextResponse.json({ 
      success: true,
      message: 'Successfully logged out'
    });
    
    // Set cookie with expiration in the past to delete it
    response.cookies.set({
      name: 'adminToken',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0 // Expire immediately
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    );
  }
}

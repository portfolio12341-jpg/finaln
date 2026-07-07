import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nsnency000@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NancyAdmin2026!';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Issue session token
      const token = await createToken({ email, role: 'admin' }, 24);
      
      const response = NextResponse.json({ success: true, message: 'Logged in successfully' });
      
      // Set secure cookie
      response.cookies.set({
        name: 'nency_session',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Error in auth API:', error);
    return NextResponse.json({ error: 'An error occurred during authentication' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('nency_session');
  return response;
}

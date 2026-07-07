import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    const sessionCookie = request.cookies.get('nency_session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    const payload = await verifyToken(sessionCookie);
    if (!payload || payload.role !== 'admin') {
      // Clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/admin', request.url));
      response.cookies.delete('nency_session');
      return response;
    }
  }

  // Redirect to dashboard if logged in and visiting login page
  if (pathname === '/admin') {
    const sessionCookie = request.cookies.get('nency_session')?.value;
    if (sessionCookie) {
      const payload = await verifyToken(sessionCookie);
      if (payload && payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/dashboard/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // 1. Auth Callback Check
  // If we're at the root and have an auth code, redirect to the callback handler
  if (pathname === '/' && searchParams.get('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  // 2. Kid Session Access Control
  // Check for kid session cookie
  const kidSessionCookie = request.cookies.get('lunara_kid_session');
  
  if (kidSessionCookie?.value) {
    try {
      const session = JSON.parse(kidSessionCookie.value);
      const kidId = session.kidId;

      // Rule A: Kids cannot access Parent Dashboard or Home
      if (pathname.startsWith('/parent') || pathname === '/home') {
        const url = request.nextUrl.clone();
        url.pathname = `/kids/${kidId}`;
        return NextResponse.redirect(url);
      }

      // Rule B: Kids can only access THEIR OWN profile/portal
      // Pattern: /kids/[targetId]...
      const match = pathname.match(/^\/kids\/([^\/]+)/);
      if (match) {
        const targetId = match[1];
        if (targetId !== kidId) {
          // Trying to access another kid's profile -> Redirect to their own
          const url = request.nextUrl.clone();
          url.pathname = `/kids/${kidId}`;
          return NextResponse.redirect(url);
        }
      }

      // Rule C: Redirect root '/' to their portal (if not caught by other rules)
      if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = `/kids/${kidId}`;
        return NextResponse.redirect(url);
      }

    } catch (e) {
      // Invalid cookie? Ignore it (allow normal flow, maybe clear it?)
      console.error('Invalid kid session cookie', e);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - student (student login page)
     * - login (parent login page)
     * - auth (auth callbacks)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|student|login|auth).*)',
    '/', // Explicitly match root
  ],
};

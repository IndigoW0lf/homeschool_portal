import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/kid-session-crypto';
import type { KidSession } from '@/lib/kid-session';

/**
 * Auth and kid-session routing.
 * Note: Next.js may deprecate the "middleware" file convention in favor of "proxy".
 * When that happens, migrate this logic per: https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Auth Callback Check
  // If we're at the root and have an auth code, redirect to the callback handler
  if (pathname === '/' && searchParams.get('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  // 2. Kid Session Access Control
  // Verify the signed cookie — unsigned/tampered cookies are rejected
  const kidSessionCookie = request.cookies.get('lunara_kid_session');

  if (kidSessionCookie?.value) {
    const session = await verifySession<KidSession>(kidSessionCookie.value);
    const kidId = session?.kidId;

    if (kidId) {
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
    }
    // If kidId is falsy (signature invalid or missing), fall through to normal flow
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

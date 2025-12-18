import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // If we're at the root and have an auth code, redirect to the callback handler
  // This handles the case where Supabase sends users to Site URL with ?code=
  if (pathname === '/' && searchParams.get('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    // Preserve all search params (code, next, etc.)
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run on root path to catch auth redirects
    '/',
  ],
};

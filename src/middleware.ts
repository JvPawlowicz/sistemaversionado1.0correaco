import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect from /financial to /analysis
  if (pathname.startsWith('/financial')) {
    const destination = new URL('/analysis', request.url);
    return NextResponse.redirect(destination);
  }

  // Redirect from /reports to /analysis
  if (pathname.startsWith('/reports')) {
    const destination = new URL('/analysis', request.url);
    return NextResponse.redirect(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/financial/:path*', '/reports/:path*'],
};

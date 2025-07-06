import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /financial and /reports to /analysis
  if (pathname.startsWith('/financial') || pathname.startsWith('/reports')) {
    const url = request.nextUrl.clone();
    url.pathname = '/analysis';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

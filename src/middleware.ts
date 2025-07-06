import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is intentionally left blank to avoid conflicts with next.config.js redirects.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Do not run middleware on any path
export const config = {
  matcher: [],
};

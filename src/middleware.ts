import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is a no-op. Redirects are handled in next.config.js.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// This matcher will not match any real routes, effectively disabling the middleware.
export const config = {
  matcher: '/this-path-does-not-exist',
};

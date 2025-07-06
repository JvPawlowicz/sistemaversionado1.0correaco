import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is a no-op. The actual redirect logic is handled in next.config.js for reliability.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// An empty matcher means this middleware will not run on any request, avoiding any potential conflicts or performance overhead.
export const config = {
  matcher: [],
};

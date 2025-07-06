import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request to handle redirects for deprecated paths.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is for a deprecated route
  if (pathname.startsWith('/financial') || pathname.startsWith('/reports')) {
    
    // Clone the URL to modify it
    const url = request.nextUrl.clone();
    
    // Replace the deprecated path segment with '/analysis'
    if (pathname.startsWith('/financial')) {
        url.pathname = pathname.replace('/financial', '/analysis');
    } else { // It must be /reports
        url.pathname = pathname.replace('/reports', '/analysis');
    }
    
    // Return a permanent redirect response
    return NextResponse.redirect(url, 308);
  }

  // For all other paths, continue as normal
  return NextResponse.next();
}

// An empty matcher config ensures the middleware runs on every request path.
export const config = {
  matcher: [],
};

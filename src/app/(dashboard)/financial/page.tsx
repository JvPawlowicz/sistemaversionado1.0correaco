'use server';

import { redirect } from 'next/navigation';

// This is a server component that performs a permanent redirect.
// This is the most reliable way to handle deprecated routes in the App Router.
export default function FinancialPage() {
  redirect('/analysis');
  // The return below is never reached but is required for the function signature
  return null;
}


'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// This page is deprecated and redirects to the dashboard.
export default function DeprecatedFinancialPage() {
  useEffect(() => {
    redirect('/dashboard');
  }, []);

  return null;
}

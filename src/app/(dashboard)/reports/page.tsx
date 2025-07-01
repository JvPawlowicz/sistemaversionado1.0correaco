'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function ReportsPageRedirect() {
  useEffect(() => {
    redirect('/analysis');
  }, []);
  
  return null;
}

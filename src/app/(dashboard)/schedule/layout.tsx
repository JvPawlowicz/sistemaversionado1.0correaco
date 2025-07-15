'use client';

import { ReactNode } from 'react';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { TherapyGroupProvider } from '@/contexts/TherapyGroupContext';
import { UserProvider } from '@/contexts/UserContext';


export default function SchedulePageLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <TherapyGroupProvider>
        <ScheduleProvider>
          {children}
        </ScheduleProvider>
      </TherapyGroupProvider>
    </UserProvider>
  );
}

'use client';

import { ReactNode } from 'react';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { TherapyGroupProvider } from '@/contexts/TherapyGroupContext';
import { UserProvider } from '@/contexts/UserContext';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { AssessmentProvider } from '@/contexts/AssessmentContext';


export default function SchedulePageLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <TherapyGroupProvider>
        <TemplateProvider>
          <AssessmentProvider>
            <ScheduleProvider>
              {children}
            </ScheduleProvider>
          </AssessmentProvider>
        </TemplateProvider>
      </TherapyGroupProvider>
    </UserProvider>
  );
}

'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { PatientProvider } from '@/contexts/PatientContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { Loader2 } from 'lucide-react';
import { UserProvider } from '@/contexts/UserContext';
import { UnitProvider } from '@/contexts/UnitContext';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
        router.push('/login');
    }
  }, [isAuthenticated, loading, router]);
  
  if (loading) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p>Carregando...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return null; // The useEffect handles the redirect
  }

  return (
    <UserProvider>
      <UnitProvider>
        <PatientProvider>
          <ScheduleProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <Header />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                  {children}
                </main>
                <footer className="border-t p-4 text-center text-sm text-muted-foreground">
                    Desenvolvido por: JVGP- João Pawlowicz
                </footer>
              </SidebarInset>
            </SidebarProvider>
          </ScheduleProvider>
        </PatientProvider>
      </UnitProvider>
    </UserProvider>
  );
}

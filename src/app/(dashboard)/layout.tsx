'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { PatientProvider } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // A small delay to allow the auth state to be read from sessionStorage
    const timer = setTimeout(() => {
        if (isAuthenticated === false) {
            router.push('/login');
        }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  if (isAuthenticated === false) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-4">
                <p>Redirecionando para a página de login...</p>
            </div>
        </div>
    );
  }

  if (isAuthenticated === undefined) {
     return (
        <div className="flex min-h-screen w-full p-4">
            <Skeleton className="hidden md:block w-16" />
            <div className="flex-1 space-y-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-[calc(100vh-8rem)]" />
            </div>
        </div>
    )
  }

  return (
    <PatientProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
    </PatientProvider>
  );
}

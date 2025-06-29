'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Shield, ShieldAlert } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';
import { Skeleton } from '@/components/ui/skeleton';
import { HealthPlanTable } from '@/components/health-plans/health-plan-table';
import { NewHealthPlanDialog } from '@/components/health-plans/new-health-plan-dialog';
import type { HealthPlanWithUnit } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HealthPlansPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { units, loading: unitsLoading, fetchUnits } = useUnit();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const router = useRouter();

  const isLoading = authLoading || unitsLoading;

  // Early return for loading state
  if (isLoading) {
     return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
  }

  // Early return for non-admins
  if (currentUser?.role !== 'Admin') {
    return (
        <Card className="mt-8">
            <CardHeader className="items-center text-center">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">Voltar para o Painel</Button>
            </CardContent>
        </Card>
    );
  }

  // Logic for Admins
  const allHealthPlans = React.useMemo(() => {
    return units
      .flatMap(unit =>
        (unit.healthPlans || []).map(plan => ({
          ...plan,
          unitName: unit.name,
          unitId: unit.id,
        }))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [units]);

  return (
    <div className="space-y-6">
      <NewHealthPlanDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPlanAdded={fetchUnits}
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Gestão de Planos de Saúde
          </h1>
          <p className="text-muted-foreground">
            Gerencie de forma centralizada todos os convênios e planos de saúde das unidades.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Plano de Saúde
        </Button>
      </div>
      
      <HealthPlanTable
          healthPlans={allHealthPlans as HealthPlanWithUnit[]}
          onPlanChanged={fetchUnits}
      />
    </div>
  );
}

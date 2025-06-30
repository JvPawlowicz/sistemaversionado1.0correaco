'use client';

import Link from 'next/link';
import { PatientTable } from '@/components/patients/patient-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Terminal, Search, Users2, GitMerge } from 'lucide-react';
import { usePatient } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnit } from '@/contexts/UnitContext';
import type { HealthPlan } from '@/lib/types';

export default function PatientsPage() {
  const { patients, loading, error } = usePatient();
  const { currentUser } = useAuth();
  const { units, loading: unitsLoading } = useUnit();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [healthPlanFilter, setHealthPlanFilter] = React.useState('all');

  const uniqueHealthPlans = React.useMemo(() => {
    const allPlans = units.flatMap(u => u.healthPlans || []);
    const uniquePlansMap = new Map<string, HealthPlan>();
    allPlans.forEach(plan => {
      if (!uniquePlansMap.has(plan.id)) {
        uniquePlansMap.set(plan.id, plan);
      }
    });
    return Array.from(uniquePlansMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [units]);
  
  const filteredPatients = patients.filter(patient => {
    const searchMatch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!searchMatch) return false;

    if (healthPlanFilter === 'all') return true;
    if (healthPlanFilter === 'none') return !patient.healthPlanId;
    return patient.healthPlanId === healthPlanFilter;
  });

  const canManageGroups = currentUser?.role === 'Admin' || currentUser?.role === 'Coordinator';
  const isAdmin = currentUser?.role === 'Admin';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Pacientes
        </h1>
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nome ou e-mail..."
                    className="pl-8 sm:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select onValueChange={setHealthPlanFilter} value={healthPlanFilter} disabled={unitsLoading}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por plano..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Planos</SelectItem>
                    <SelectItem value="none">Particular</SelectItem>
                    {uniqueHealthPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {canManageGroups && (
                <Button asChild variant="outline">
                  <Link href="/groups">
                    <Users2 className="mr-2 h-4 w-4" />
                    Gerenciar Grupos
                  </Link>
                </Button>
            )}
             {isAdmin && (
                <Button asChild variant="outline">
                  <Link href="/merge-patients">
                    <GitMerge className="mr-2 h-4 w-4" />
                    Mesclar Pacientes
                  </Link>
                </Button>
            )}
            <Button asChild>
            <Link href="/patients/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Paciente
            </Link>
            </Button>
        </div>
      </div>
      {loading ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      ) : (
        <PatientTable patients={filteredPatients} searchTerm={searchTerm} />
      )}
    </div>
  );
}

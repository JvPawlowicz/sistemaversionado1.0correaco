'use client';

import Link from 'next/link';
import { PatientTable } from '@/components/patients/patient-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Terminal, Search, Users2 } from 'lucide-react';
import { usePatient } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientsPage() {
  const { patients, loading, error } = usePatient();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const canManageGroups = currentUser?.role === 'Admin' || currentUser?.role === 'Coordinator';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Pacientes
        </h1>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nome ou e-mail..."
                    className="pl-8 sm:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {canManageGroups && (
                <Button variant="outline" disabled>
                    <Users2 className="mr-2 h-4 w-4" />
                    Novo Grupo
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

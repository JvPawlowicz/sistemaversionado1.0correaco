
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePatient } from '@/contexts/PatientContext';
import { PatientSearchComboBox } from '@/components/patients/patient-search-combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mergePatientsAction } from '@/lib/actions/patient';
import { Loader2, GitMerge, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormState();
  return (
    <Button type="submit" disabled={pending} variant="destructive">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirmar e Mesclar Pacientes
    </Button>
  );
}

function PatientComparisonCard({ patient, title }: { patient: Patient; title: string }) {
  const [counts, setCounts] = React.useState({ appointments: 0, evolutions: 0, documents: 0 });
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!patient || !db) return;
      setLoading(true);
      try {
        const appointmentsSnap = await getDocs(query(collection(db, 'appointments'), where('patientId', '==', patient.id)));
        const evolutionsSnap = await getDocs(collection(db, 'patients', patient.id, 'evolutionRecords'));
        const documentsSnap = await getDocs(collection(db, 'patients', patient.id, 'documents'));
        
        setCounts({
          appointments: appointmentsSnap.size,
          evolutions: evolutionsSnap.size,
          documents: documentsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching patient comparison data:", error);
        setCounts({ appointments: 0, evolutions: 0, documents: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [patient]);

  return (
    <Card className="flex-1">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{patient.name}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Telefone:</span>
          <span className="font-medium">{patient.phone || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">E-mail:</span>
          <span className="font-medium">{patient.email || 'N/A'}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Agendamentos:</span>
          {loading ? <Skeleton className="h-5 w-5" /> : <span className="font-bold">{counts.appointments}</span>}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Evoluções:</span>
          {loading ? <Skeleton className="h-5 w-5" /> : <span className="font-bold">{counts.evolutions}</span>}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Documentos:</span>
           {loading ? <Skeleton className="h-5 w-5" /> : <span className="font-bold">{counts.documents}</span>}
        </div>
      </CardContent>
    </Card>
  );
}


export default function MergePatientsPage() {
  const { currentUser } = useAuth();
  const { patients: allPatients, loading: patientsLoading, fetchPatients } = usePatient();
  const { toast } = useToast();
  const router = useRouter();

  const [primaryPatientId, setPrimaryPatientId] = useState<string | null>(null);
  const [secondaryPatientId, setSecondaryPatientId] = useState<string | null>(null);
  const [state, formAction] = useFormState(mergePatientsAction, initialState);

  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchPatients(); // Refresh the patient list
      router.push('/patients'); // Navigate back to the main list
    } else if (state.message) {
      toast({ variant: 'destructive', title: 'Erro na Mesclagem', description: state.message });
    }
  }, [state, toast, router, fetchPatients]);
  
  if (currentUser?.role !== 'Admin') {
    return (
        <Card className="mt-8">
            <CardHeader className="items-center text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">Voltar para o Painel</Button>
            </CardContent>
        </Card>
    );
  }

  const primaryPatient = allPatients.find(p => p.id === primaryPatientId);
  const secondaryPatient = allPatients.find(p => p.id === secondaryPatientId);

  const canSubmit = primaryPatientId && secondaryPatientId && primaryPatientId !== secondaryPatientId;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mesclar Pacientes Duplicados</h1>
        <p className="text-muted-foreground">
          Use esta ferramenta para combinar registros de pacientes duplicados em um único perfil.
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Ação Irreversível</AlertTitle>
        <AlertDescription>
          A mesclagem de pacientes é uma ação permanente. O registro do &quot;Paciente Duplicado&quot; será **excluído** e todos os seus dados serão transferidos para o &quot;Paciente Principal&quot;. Proceda com extrema cautela.
        </AlertDescription>
      </Alert>

      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>Passo 1: Selecionar Pacientes</CardTitle>
            <CardDescription>
              Escolha o perfil principal a ser mantido e o perfil duplicado a ser mesclado e excluído.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-patient">Paciente Principal (Manter)</Label>
              <input type="hidden" name="primaryPatientId" value={primaryPatientId || ''} />
              <PatientSearchComboBox
                patients={allPatients.filter(p => p.id !== secondaryPatientId)}
                selectedPatientId={primaryPatientId}
                onSelectPatient={setPrimaryPatientId}
                loading={patientsLoading}
                placeholder="Buscar paciente principal..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-patient">Paciente Duplicado (Mesclar e Excluir)</Label>
               <input type="hidden" name="secondaryPatientId" value={secondaryPatientId || ''} />
              <PatientSearchComboBox
                patients={allPatients.filter(p => p.id !== primaryPatientId)}
                selectedPatientId={secondaryPatientId}
                onSelectPatient={setSecondaryPatientId}
                loading={patientsLoading}
                placeholder="Buscar paciente duplicado..."
              />
            </div>
          </CardContent>
          {primaryPatient && secondaryPatient && (
            <CardFooter className="flex-col items-start gap-4 border-t pt-6">
              <h3 className="font-semibold">Resumo da Mesclagem</h3>
               <p className="text-sm text-muted-foreground">Revise os dados abaixo. Itens do &quot;Paciente Duplicado&quot; serão mesclados ao &quot;Paciente Principal&quot; se o campo correspondente no principal estiver vazio. Todos os registros associados (agendamentos, evoluções, etc.) serão transferidos.</p>
              <div className="flex w-full items-start justify-center gap-4 rounded-lg p-2">
                <PatientComparisonCard patient={primaryPatient} title="Manter Este Perfil" />
                <div className="flex h-full flex-col justify-center pt-24">
                   <ArrowRight className="h-8 w-8 shrink-0 text-muted-foreground" />
                </div>
                <PatientComparisonCard patient={secondaryPatient} title="Mesclar e Excluir" />
              </div>
            </CardFooter>
          )}
        </Card>

        {canSubmit && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Passo 2: Confirmação</CardTitle>
              <CardDescription>
                Revise as informações acima. Ao clicar no botão abaixo, a mesclagem será executada e não poderá ser desfeita.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}

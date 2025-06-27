'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { usePatient } from '@/contexts/PatientContext';
import type { EvolutionRecord } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';


export default function EvolutionsPage() {
  const { appointments, loading: scheduleLoading } = useSchedule();
  const { patients, loading: patientsLoading } = usePatient();
  const [evolutions, setEvolutions] = React.useState<EvolutionRecord[]>([]);
  const [loadingEvolutions, setLoadingEvolutions] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const loading = scheduleLoading || patientsLoading || loadingEvolutions;

  React.useEffect(() => {
    const fetchAllEvolutions = async () => {
        if (patientsLoading || patients.length === 0) {
            setLoadingEvolutions(false);
            return;
        }

        setLoadingEvolutions(true);
        const allEvolutions: EvolutionRecord[] = [];

        try {
            for (const patient of patients) {
                const recordsCollectionRef = collection(db, 'patients', patient.id, 'evolutionRecords');
                const q = query(recordsCollectionRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedRecords = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...(data as Omit<EvolutionRecord, 'id' | 'patientId' | 'patientName'>),
                        patientName: patient.name,
                        patientId: patient.id,
                    };
                });
                allEvolutions.push(...fetchedRecords);
            }
            setEvolutions(allEvolutions);
        } catch (error) {
            console.error("Error fetching all evolution records: ", error);
        } finally {
            setLoadingEvolutions(false);
        }
    };
    fetchAllEvolutions();
  }, [patients, patientsLoading]);


  const pendingEvolutions = React.useMemo(() => {
    const appointmentsToConsider = appointments.filter(app => app.status === 'Realizado');

    const appointmentsWithPendingEvolution = appointmentsToConsider.filter(app => {
        const appDate = startOfDay(new Date(app.date + 'T00:00:00'));
        const evolutionExists = evolutions.some(evo => {
            if (!evo.createdAt || evo.patientId !== app.patientId) return false;
            const evoDate = startOfDay(evo.createdAt.toDate());
            return evoDate.getTime() >= appDate.getTime();
        });
        return !evolutionExists;
    });
    
    return appointmentsWithPendingEvolution
      .filter(app => 
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.professionalName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, evolutions, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Evoluções Pendentes
          </h1>
          <p className="text-muted-foreground">
            Acompanhe e registre as evoluções dos atendimentos realizados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por paciente ou profissional..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" disabled>Lembrar Selecionados</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos Aguardando Evolução</CardTitle>
          <CardDescription>
            Esta lista mostra os atendimentos concluídos que ainda não tiveram uma evolução registrada na mesma data ou em data posterior.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead className="hidden md:table-cell">Profissional</TableHead>
                            <TableHead className="hidden sm:table-cell">Serviço</TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                        ) : pendingEvolutions.length > 0 ? (
                            pendingEvolutions.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell>{format(new Date(app.date + 'T00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                    <TableCell className="font-medium">{app.patientName}</TableCell>
                                    <TableCell className="hidden md:table-cell">{app.professionalName}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{app.serviceName}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/patients/${app.patientId}`}>
                                                <LinkIcon className="mr-2 h-3 w-3" />
                                                Registrar
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma evolução pendente encontrada.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

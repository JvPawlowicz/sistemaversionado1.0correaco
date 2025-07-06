
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DatePicker } from '@/components/ui/date-picker';
import { useUser } from '@/contexts/UserContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { usePatient } from '@/contexts/PatientContext';
import { subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { EvolutionRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getDisplayAvatarUrl } from '@/lib/utils';

interface PerformanceData {
  userId: string;
  name: string;
  avatarUrl: string;
  role: string;
  attendedAppointments: number;
  scheduledAppointments: number;
  noShows: number;
  occupationRate: string;
  noShowRate: string;
  evolutionsCount: number;
}

export default function TeamPerformancePage() {
  const { users, loading: usersLoading } = useUser();
  const { appointments, loading: scheduleLoading } = useSchedule();
  const { patients, loading: patientsLoading } = usePatient();
  
  const [evolutions, setEvolutions] = React.useState<EvolutionRecord[]>([]);
  const [loadingEvolutions, setLoadingEvolutions] = React.useState(true);

  const [filters, setFilters] = React.useState<{startDate: Date | null, endDate: Date | null}>({
    startDate: null,
    endDate: null,
  });

  // Defer setting initial date to avoid hydration mismatch
  React.useEffect(() => {
    setFilters({
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date()),
    });
  }, []);

  const isLoading = usersLoading || scheduleLoading || patientsLoading || loadingEvolutions;

  React.useEffect(() => {
    const fetchAllEvolutions = async () => {
      if (patientsLoading || patients.length === 0) {
        setLoadingEvolutions(false);
        return;
      }

      if (!db) {
        console.error("Firestore DB is not initialized.");
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
              ...(data as Omit<EvolutionRecord, 'id'>),
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

  const performanceData = React.useMemo<PerformanceData[]>(() => {
    if (isLoading || !filters.startDate || !filters.endDate) return [];

    const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Coordinator');

    return professionals.map(pro => {
      const proAppointments = appointments.filter(app => 
        app.professionalName === pro.name && 
        isWithinInterval(new Date(app.date + 'T00:00:00'), { start: filters.startDate!, end: filters.endDate! })
      );
      
      const proEvolutions = evolutions.filter(evo =>
        evo.author === pro.name &&
        evo.createdAt &&
        isWithinInterval(evo.createdAt.toDate(), { start: filters.startDate!, end: filters.endDate! })
      );

      const attendedAppointments = proAppointments.filter(app => app.status === 'Realizado').length;
      const noShows = proAppointments.filter(app => app.status === 'Faltou').length;
      const scheduledAppointments = proAppointments.filter(app => ['Agendado', 'Realizado', 'Faltou'].includes(app.status)).length;
      
      const occupationRate = scheduledAppointments > 0 ? ((attendedAppointments / scheduledAppointments) * 100).toFixed(1) : '0.0';
      const noShowRate = scheduledAppointments > 0 ? ((noShows / scheduledAppointments) * 100).toFixed(1) : '0.0';

      return {
        userId: pro.id,
        name: pro.name,
        avatarUrl: pro.avatarUrl,
        role: pro.role,
        attendedAppointments,
        scheduledAppointments,
        noShows,
        occupationRate: `${occupationRate}%`,
        noShowRate: `${noShowRate}%`,
        evolutionsCount: proEvolutions.length,
      };
    }).sort((a,b) => b.attendedAppointments - a.attendedAppointments);
  }, [isLoading, users, appointments, evolutions, filters]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`;
    return name.substring(0, 2);
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Desempenho da Equipe</h1>
        <p className="text-muted-foreground">
          Analise a produtividade e os resultados dos profissionais da clínica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Análise</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
                <DatePicker value={filters.startDate || undefined} onChange={date => date && handleFilterChange('startDate', startOfDay(date))} />
                <span className="text-muted-foreground">-</span>
                <DatePicker value={filters.endDate || undefined} onChange={date => date && handleFilterChange('endDate', endOfDay(date))} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-center">Atendimentos Realizados</TableHead>
                    <TableHead className="text-center">Taxa de Ocupação</TableHead>
                    <TableHead className="text-center">Taxa de Faltas</TableHead>
                    <TableHead className="text-center">Evoluções Registradas</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><div className="flex items-center gap-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></div></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : performanceData.length > 0 ? (
                    performanceData.map(pro => (
                    <TableRow key={pro.userId}>
                        <TableCell>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={getDisplayAvatarUrl(pro.avatarUrl)} alt={pro.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{getInitials(pro.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{pro.name}</p>
                            <p className="text-sm text-muted-foreground">{pro.role}</p>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-lg">{pro.attendedAppointments}</TableCell>
                        <TableCell className="text-center">{pro.occupationRate}</TableCell>
                        <TableCell className="text-center">{pro.noShowRate}</TableCell>
                        <TableCell className="text-center">{pro.evolutionsCount}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum dado encontrado para o período selecionado.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

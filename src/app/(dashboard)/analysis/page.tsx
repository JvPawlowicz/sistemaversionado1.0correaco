
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Activity, Download, SlidersHorizontal, Trash, FileSignature, ListChecks } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, isWithinInterval, startOfDay, addDays, isAfter, isBefore, isEqual, format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartPie } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatient } from '@/contexts/PatientContext';
import { useUser } from '@/contexts/UserContext';
import { useUnit } from '@/contexts/UnitContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { Appointment, EvolutionRecord } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';


interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  loading: boolean;
}

function StatCard({ title, value, icon: Icon, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-1/4 mt-1" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const overviewChartConfig = {
  realizado: { label: 'Realizado', color: 'hsl(var(--chart-2))' },
  agendado: { label: 'Agendado', color: 'hsl(var(--chart-4))' },
  faltou: { label: 'Faltou', color: 'hsl(var(--chart-5))' },
  cancelado: { label: 'Cancelado', color: 'hsl(var(--muted))' },
} satisfies ChartConfig;

const evolutionsChartConfig = {
    count: { label: 'Evoluções', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

const demographicsAgeChartConfig = {
  count: { label: 'Pacientes', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

const demographicsGenderChartConfig = {
  masculino: { label: 'Masculino', color: 'hsl(var(--chart-2))' },
  feminino: { label: 'Feminino', color: 'hsl(var(--chart-4))' },
  outro: { label: 'Outro', color: 'hsl(var(--chart-3))' },
  naoinformado: { label: 'Não Informado', color: 'hsl(var(--muted))' },
} satisfies ChartConfig;

const maritalStatusChartConfig = {
  count: { label: 'Pacientes', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;


export default function AnalysisAndReportsPage() {
  const { appointments, loading: scheduleLoading } = useSchedule();
  const { patients, loading: patientsLoading } = usePatient();
  const { users, loading: usersLoading } = useUser();
  const { units, selectedUnitId, loading: unitsLoading } = useUnit();
  
  const [evolutions, setEvolutions] = React.useState<(EvolutionRecord & { patientName: string; patientId: string; })[]>([]);
  const [loadingEvolutions, setLoadingEvolutions] = React.useState(true);
  
  const [appointmentFilters, setAppointmentFilters] = React.useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    patientId: '',
    professionalName: '',
    serviceId: '',
    status: '',
    healthPlanId: '',
  });
  const [evolutionFilters, setEvolutionFilters] = React.useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    patientId: '',
    author: '',
  });

  React.useEffect(() => {
    // This runs only on the client after mount, avoiding hydration mismatch
    setAppointmentFilters(prev => ({
      ...prev,
      startDate: startOfDay(addDays(new Date(), -30)),
      endDate: startOfDay(new Date()),
    }));
    setEvolutionFilters(prev => ({
      ...prev,
      startDate: startOfDay(addDays(new Date(), -30)),
      endDate: startOfDay(new Date()),
    }));
  }, []);

  const isLoading = scheduleLoading || patientsLoading || usersLoading || unitsLoading || loadingEvolutions;
  
  const selectedUnit = React.useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);

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
        const allEvolutions: (EvolutionRecord & { patientName: string; patientId: string; })[] = [];

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
            allEvolutions.sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
            setEvolutions(allEvolutions);
        } catch (error) {
            console.error("Error fetching all evolution records: ", error);
        } finally {
            setLoadingEvolutions(false);
        }
    };
    fetchAllEvolutions();
  }, [patients, patientsLoading]);

  // --- Calculations useMemo hooks ---
  const overviewAnalysisData = React.useMemo(() => {
    const overviewEndDate = new Date();
    const overviewStartDate = startOfDay(subDays(overviewEndDate, 30));

    const appointmentsInPeriod = appointments.filter(app =>
      isWithinInterval(new Date(app.date + 'T00:00:00'), { start: overviewStartDate, end: overviewEndDate })
    );

    const total = appointmentsInPeriod.length;
    const realizado = appointmentsInPeriod.filter(app => app.status === 'Realizado').length;
    const faltou = appointmentsInPeriod.filter(app => app.status === 'Faltou').length;
    const agendado = appointmentsInPeriod.filter(app => app.status === 'Agendado').length;
    const cancelado = appointmentsInPeriod.filter(app => app.status === 'Cancelado').length;

    const possibleSlots = realizado + faltou + agendado;
    const occupationRate = possibleSlots > 0 ? (realizado / possibleSlots * 100).toFixed(1) : '0.0';
    const absenceRate = possibleSlots > 0 ? (faltou / possibleSlots * 100).toFixed(1) : '0.0';

    const chartData = [
        { status: 'realizado', count: realizado, fill: 'var(--color-realizado)' },
        { status: 'agendado', count: agendado, fill: 'var(--color-agendado)' },
        { status: 'faltou', count: faltou, fill: 'var(--color-faltou)' },
        { status: 'cancelado', count: cancelado, fill: 'var(--color-cancelado)' },
    ].filter(item => item.count > 0);

    return { total, realizado, faltou, agendado, occupationRate, absenceRate, chartData };
  }, [appointments]);

  const evolutionAnalysisData = React.useMemo(() => {
    const evolutionEndDate = new Date();
    const evolutionStartDate = startOfDay(subDays(evolutionEndDate, 30));

    const evolutionsInPeriod = evolutions.filter(evo => 
        evo.createdAt && isWithinInterval(evo.createdAt.toDate(), { start: evolutionStartDate, end: evolutionEndDate })
    );

    const attendedAppointmentsInPeriod = appointments.filter(app => 
        app.status === 'Realizado' && isWithinInterval(new Date(app.date + 'T00:00:00'), { start: evolutionStartDate, end: evolutionEndDate })
    );
    
    const pendingCount = attendedAppointmentsInPeriod.length;

    const evolutionsByAuthor = evolutionsInPeriod.reduce((acc, evo) => {
        acc[evo.author] = (acc[evo.author] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const evolutionChartData = Object.entries(evolutionsByAuthor).map(([author, count]) => ({ author, count }));

    return { total: evolutionsInPeriod.length, pending: pendingCount, chartData: evolutionChartData };
  }, [evolutions, appointments]);

  const demographicsData = React.useMemo(() => {
    if (!patients || patients.length === 0) {
      return { ageData: [], genderData: [], diagnosisData: [], maritalStatusData: [], healthPlanData: [] };
    }

    const ageGroups: { [key: string]: number } = { '0-3': 0, '4-7': 0, '8-12': 0, '13-17': 0, '18+': 0, 'N/A': 0 };
    patients.forEach(p => {
      if (p.dob) {
        try {
          const age = differenceInYears(new Date(), new Date(p.dob));
          if (age <= 3) ageGroups['0-3']++;
          else if (age <= 7) ageGroups['4-7']++;
          else if (age <= 12) ageGroups['8-12']++;
          else if (age <= 17) ageGroups['13-17']++;
          else ageGroups['18+']++;
        } catch (e) {
          ageGroups['N/A']++;
        }
      } else {
        ageGroups['N/A']++;
      }
    });
    const ageData = Object.entries(ageGroups).map(([group, count]) => ({ group, count }));

    const genderCounts = patients.reduce((acc, p) => {
      const key = p.gender ? p.gender.toLowerCase() : 'naoinformado';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderData = Object.entries(genderCounts).map(([gender, count]) => ({
      status: gender,
      count,
      fill: `var(--color-${gender})`,
    }));

    const diagnosisCounts = patients.reduce((acc, p) => {
      if (p.diagnosis) {
        const diagnoses = p.diagnosis.split(',').map(d => d.trim().toLowerCase());
        diagnoses.forEach(diag => {
          if (diag) {
            acc[diag] = (acc[diag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const diagnosisData = Object.entries(diagnosisCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([diagnosis, count]) => ({ diagnosis, count }));
      
    const maritalStatusCounts = patients.reduce((acc, p) => {
        const status = (p.maritalStatus || 'Não Informado').trim();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const maritalStatusData = Object.entries(maritalStatusCounts).map(([status, count]) => ({ status, count }));

    const healthPlanCounts = patients.reduce((acc, p) => {
        const planName = (p.healthPlanName || 'Particular').trim();
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const healthPlanData = Object.entries(healthPlanCounts).map(([plan, count]) => ({ plan, count }));

    return { ageData, genderData, diagnosisData, maritalStatusData, healthPlanData };
  }, [patients]);


  // --- Appointments Report Logic ---
  const [filteredAppointments, setFilteredAppointments] = React.useState<Appointment[]>([]);
  
  const availableServices = selectedUnit?.services || [];
  const availableHealthPlans = selectedUnit?.healthPlans || [];
  const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Coordinator' || u.role === 'Admin');

  const handleAppointmentFilterChange = (key: keyof typeof appointmentFilters, value: any) => {
    setAppointmentFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const applyAppointmentFilters = React.useCallback(() => {
    let result = appointments;
    if (appointmentFilters.startDate) {
      result = result.filter(app => isEqual(new Date(app.date + 'T00:00:00'), appointmentFilters.startDate!) || isAfter(new Date(app.date + 'T00:00:00'), appointmentFilters.startDate!));
    }
    if (appointmentFilters.endDate) {
      result = result.filter(app => isEqual(new Date(app.date + 'T00:00:00'), appointmentFilters.endDate!) || isBefore(new Date(app.date + 'T00:00:00'), appointmentFilters.endDate!));
    }
    if (appointmentFilters.patientId) result = result.filter(app => app.patientId === appointmentFilters.patientId);
    if (appointmentFilters.professionalName) result = result.filter(app => app.professionalName === appointmentFilters.professionalName);
    if (appointmentFilters.serviceId) result = result.filter(app => app.serviceId === appointmentFilters.serviceId);
    if (appointmentFilters.status) result = result.filter(app => app.status === appointmentFilters.status);
    if (appointmentFilters.healthPlanId) {
        if(appointmentFilters.healthPlanId === 'none') {
            result = result.filter(app => !app.healthPlanId);
        } else {
            result = result.filter(app => app.healthPlanId === appointmentFilters.healthPlanId);
        }
    }
    
    result.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    setFilteredAppointments(result);
  }, [appointments, appointmentFilters]);
  
  const clearAppointmentFilters = () => {
    setAppointmentFilters({
        startDate: addDays(new Date(), -30),
        endDate: new Date(),
        patientId: '',
        professionalName: '',
        serviceId: '',
        status: '',
        healthPlanId: '',
    });
    setFilteredAppointments([]);
  };

  const handleExportAppointmentsPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text('Relatório de Agendamentos', 14, 16);
    (doc as any).autoTable({
        startY: 22,
        head: [['Data', 'Horário', 'Paciente', 'Profissional', 'Serviço', 'Plano', 'Status']],
        body: filteredAppointments.map(app => [
            format(new Date(app.date + "T00:00:00"), 'dd/MM/yyyy', { locale: ptBR }),
            `${app.time} - ${app.endTime}`,
            app.patientName,
            app.professionalName,
            app.serviceName,
            app.healthPlanName || 'Particular',
            app.status
        ]),
        headStyles: { fillColor: [63, 76, 181] },
        theme: 'grid',
    });
    doc.save('relatorio_agendamentos.pdf');
  };

  // --- Evolutions Report Logic ---
  const [filteredEvolutions, setFilteredEvolutions] = React.useState<(EvolutionRecord & { patientName: string; patientId: string; })[]>([]);

  const allAuthors = React.useMemo(() => [...new Set(evolutions.map(e => e.author))], [evolutions]);

  const handleEvolutionFilterChange = (key: keyof typeof evolutionFilters, value: any) => {
    setEvolutionFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const applyEvolutionFilters = React.useCallback(() => {
    let result = evolutions;
    if (evolutionFilters.startDate) {
        result = result.filter(evo => evo.createdAt && isAfter(evo.createdAt.toDate(), evolutionFilters.startDate!));
    }
    if (evolutionFilters.endDate) {
        result = result.filter(evo => evo.createdAt && isBefore(evo.createdAt.toDate(), evolutionFilters.endDate!));
    }
    if (evolutionFilters.patientId) result = result.filter(evo => evo.patientId === evolutionFilters.patientId);
    if (evolutionFilters.author) result = result.filter(evo => evo.author === evolutionFilters.author);
    
    setFilteredEvolutions(result);
  }, [evolutions, evolutionFilters]);

  const clearEvolutionFilters = () => {
    setEvolutionFilters({ startDate: addDays(new Date(), -30), endDate: new Date(), patientId: '', author: '' });
    setFilteredEvolutions([]);
  };

  const handleExportEvolutionsPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text('Relatório de Evoluções', 14, 16);
    (doc as any).autoTable({
        startY: 22,
        head: [['Data', 'Paciente', 'Profissional', 'Título']],
        body: filteredEvolutions.map(evo => [
            evo.createdAt ? format(evo.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A',
            evo.patientName,
            evo.author,
            evo.title
        ]),
        headStyles: { fillColor: [63, 76, 181] },
        theme: 'grid',
    });
    doc.save('relatorio_evolucoes.pdf');
  };
  
  const healthPlanChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    const allUnitPlans = units.flatMap(u => u.healthPlans || []);
    const uniquePlans = Array.from(new Map(allUnitPlans.map(p => [p.id, p])).values());

    uniquePlans.forEach((plan) => {
      config[plan.name] = {
        label: plan.name,
        color: plan.color,
      };
    });
    config['Particular'] = { label: 'Particular', color: 'hsl(var(--muted))' };
    return config;
  }, [units]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Análise e Relatórios</h1>
        <p className="text-muted-foreground">Explore os dados da clínica, visualize tendências e gere relatórios detalhados.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral e KPIs</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="evolutions">Evoluções</TabsTrigger>
          <TabsTrigger value="demographics">Demografia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
           <div className="space-y-6">
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Taxa de Ocupação" value={`${overviewAnalysisData.occupationRate}%`} icon={TrendingUp} description="De agendamentos não cancelados" loading={isLoading} />
                <StatCard title="Taxa de Faltas" value={`${overviewAnalysisData.absenceRate}%`} icon={TrendingDown} description="De agendamentos não cancelados" loading={isLoading} />
                <StatCard title="Atendimentos Realizados" value={overviewAnalysisData.realizado} icon={Activity} description="Total de sessões concluídas" loading={isLoading} />
                 <StatCard title="Total de Agendamentos" value={overviewAnalysisData.total} icon={Clock} description="Incluindo cancelados" loading={isLoading} />
              </div>

              <Card>
                <CardHeader><CardTitle>Visão Geral dos Atendimentos</CardTitle><CardDescription>Distribuição de status dos agendamentos nos últimos 30 dias.</CardDescription></CardHeader>
                <CardContent>
                   {isLoading ? <Skeleton className="h-64 w-full" /> : overviewAnalysisData.chartData.length > 0 ? (
                    <ChartContainer config={overviewChartConfig} className="mx-auto aspect-square max-h-[300px]"><ChartPie data={overviewAnalysisData.chartData} nameKey="status" dataKey="count"><ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} /></ChartPie></ChartContainer>
                    ) : ( <div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhum dado de agendamento no período para exibir o gráfico.</p></div> )}
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Filtros do Relatório</CardTitle><CardDescription>Selecione os critérios para gerar o relatório de agendamentos.</CardDescription></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="flex flex-col space-y-2"><label className="text-sm font-medium">Período</label><div className="flex items-center gap-2"><DatePicker value={appointmentFilters.startDate || undefined} onChange={date => date && handleAppointmentFilterChange('startDate', startOfDay(date))} /><span className="text-muted-foreground">-</span><DatePicker value={appointmentFilters.endDate || undefined} onChange={date => date && handleAppointmentFilterChange('endDate', startOfDay(date))} /></div></div>
                <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Paciente</label><Select onValueChange={value => handleAppointmentFilterChange('patientId', value)} value={appointmentFilters.patientId} disabled={isLoading}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Profissional</label><Select onValueChange={value => handleAppointmentFilterChange('professionalName', value)} value={appointmentFilters.professionalName} disabled={isLoading}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{professionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Serviço</label><Select onValueChange={value => handleAppointmentFilterChange('serviceId', value)} value={appointmentFilters.serviceId} disabled={isLoading || availableServices.length === 0}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Plano de Saúde</label><Select onValueChange={value => handleAppointmentFilterChange('healthPlanId', value)} value={appointmentFilters.healthPlanId} disabled={isLoading || availableHealthPlans.length === 0}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="none">Particular</SelectItem>{availableHealthPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Status</label><Select onValueChange={value => handleAppointmentFilterChange('status', value)} value={appointmentFilters.status}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Agendado">Agendado</SelectItem><SelectItem value="Realizado">Realizado</SelectItem><SelectItem value="Faltou">Faltou</SelectItem><SelectItem value="Cancelado">Cancelado</SelectItem></SelectContent></Select></div>
                <div className="flex items-end gap-2 col-span-full sm:col-span-1 lg:col-span-2 xl:col-span-1"><Button onClick={applyAppointmentFilters} className="w-full sm:w-auto flex-1"><SlidersHorizontal className="mr-2" />Aplicar Filtros</Button><Button onClick={clearAppointmentFilters} className="w-full sm:w-auto" variant="outline"><Trash className="mr-2" />Limpar</Button></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Resultados</CardTitle><CardDescription>{filteredAppointments.length} registro(s) encontrado(s).</CardDescription></div><Button onClick={handleExportAppointmentsPdf} variant="outline" disabled={filteredAppointments.length === 0}><Download className="mr-2" /> Exportar PDF</Button></CardHeader>
              <CardContent><div className="rounded-lg border bg-card text-card-foreground shadow-sm"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Serviço</TableHead><TableHead className="hidden md:table-cell">Profissional</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead></TableRow></TableHeader><TableBody>{isLoading ? (<TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>) : filteredAppointments.length > 0 ? (filteredAppointments.map(app => (<TableRow key={app.id}><TableCell><div className="font-medium">{format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy')}</div><div className="text-sm text-muted-foreground">{`${app.time}-${app.endTime}`}</div></TableCell><TableCell>{app.patientName}</TableCell><TableCell>{app.serviceName}</TableCell><TableCell className="hidden md:table-cell">{app.professionalName}</TableCell><TableCell className="hidden sm:table-cell"><Badge variant={app.status === 'Realizado' ? 'default' : 'secondary'}>{app.status}</Badge></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum resultado. Aplique os filtros para gerar um relatório.</TableCell></TableRow>)}</TableBody></Table></div></CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="evolutions" className="mt-4">
           <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Evoluções Registradas" value={evolutionAnalysisData.total} icon={FileSignature} description="Nos últimos 30 dias" loading={isLoading} />
                    <StatCard title="Evoluções Pendentes" value={evolutionAnalysisData.pending} icon={ListChecks} description="Atendimentos &apos;Realizados&apos; no período" loading={isLoading} />
                </div>
                <Card>
                    <CardHeader><CardTitle>Evoluções por Profissional</CardTitle><CardDescription>Total de evoluções registradas por profissional nos últimos 30 dias.</CardDescription></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-64 w-full" /> : evolutionAnalysisData.chartData.length > 0 ? (
                           <ChartContainer config={evolutionsChartConfig} className="min-h-[200px] w-full h-64">
                                <BarChart accessibilityLayer data={evolutionAnalysisData.chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="author" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 10)} />
                                    <YAxis />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : ( <div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhuma evolução registrada no período.</p></div>)}
                    </CardContent>
                </Card>
                 <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Filtros do Relatório de Evoluções</CardTitle><CardDescription>Selecione os critérios para gerar o relatório.</CardDescription></CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <div className="flex flex-col space-y-2"><label className="text-sm font-medium">Período</label><div className="flex items-center gap-2"><DatePicker value={evolutionFilters.startDate || undefined} onChange={date => date && handleEvolutionFilterChange('startDate', startOfDay(date))} /><span className="text-muted-foreground">-</span><DatePicker value={evolutionFilters.endDate || undefined} onChange={date => date && handleEvolutionFilterChange('endDate', startOfDay(date))} /></div></div>
                            <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Paciente</label><Select onValueChange={value => handleEvolutionFilterChange('patientId', value)} value={evolutionFilters.patientId} disabled={isLoading}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="flex flex-col space-y-1.5"><label className="text-sm font-medium">Profissional</label><Select onValueChange={value => handleEvolutionFilterChange('author', value)} value={evolutionFilters.author} disabled={isLoading}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{allAuthors.map(author => <SelectItem key={author} value={author}>{author}</SelectItem>)}</SelectContent></Select></div>
                            <div className="flex items-end gap-2 col-span-full sm:col-span-1 lg:col-span-2 xl:col-span-1"><Button onClick={applyEvolutionFilters} className="w-full sm:w-auto flex-1"><SlidersHorizontal className="mr-2" />Aplicar Filtros</Button><Button onClick={clearEvolutionFilters} className="w-full sm:w-auto" variant="outline"><Trash className="mr-2" />Limpar</Button></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Resultados</CardTitle><CardDescription>{filteredEvolutions.length} evolução(ões) encontrada(s).</CardDescription></div><Button onClick={handleExportEvolutionsPdf} variant="outline" disabled={filteredEvolutions.length === 0}><Download className="mr-2" /> Exportar PDF</Button></CardHeader>
                        <CardContent><div className="rounded-lg border bg-card text-card-foreground shadow-sm"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Profissional</TableHead><TableHead>Título</TableHead></TableRow></TableHeader><TableBody>{isLoading ? (<TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>) : filteredEvolutions.length > 0 ? (filteredEvolutions.map(evo => (<TableRow key={evo.id}><TableCell>{evo.createdAt ? format(evo.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell><TableCell>{evo.patientName}</TableCell><TableCell>{evo.author}</TableCell><TableCell><Button variant="link" asChild className="p-0 h-auto"><Link href={`/patients/${evo.patientId}`}>{evo.title}</Link></Button></TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="text-center h-24">Nenhum resultado. Aplique os filtros para gerar um relatório.</TableCell></TableRow>)}</TableBody></Table></div></CardContent>
                    </Card>
                 </div>
           </div>
        </TabsContent>

        <TabsContent value="demographics" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>Distribuição por Faixa Etária</CardTitle>
                <CardDescription>Número de pacientes por grupo de idade.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : demographicsData.ageData.length > 0 ? (
                  <ChartContainer config={demographicsAgeChartConfig} className="min-h-[200px] w-full h-64">
                    <BarChart accessibilityLayer data={demographicsData.ageData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="group" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : ( <div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhum paciente para analisar.</p></div>)}
              </CardContent>
            </Card>
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>Distribuição por Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : demographicsData.genderData.length > 0 ? (
                  <ChartContainer config={demographicsGenderChartConfig} className="mx-auto aspect-square max-h-[300px]">
                    <ChartPie data={demographicsData.genderData} nameKey="status" dataKey="count">
                      <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                    </ChartPie>
                  </ChartContainer>
                ) : ( <div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhum paciente para analisar.</p></div>)}
              </CardContent>
            </Card>
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>Distribuição por Estado Civil</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : demographicsData.maritalStatusData.length > 0 ? (
                  <ChartContainer config={maritalStatusChartConfig} className="min-h-[200px] w-full h-64">
                    <BarChart accessibilityLayer data={demographicsData.maritalStatusData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="status" type="category" tickLine={false} tickMargin={10} axisLine={false} width={80} />
                      <XAxis type="number" hide />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} layout="vertical" />
                    </BarChart>
                  </ChartContainer>
                ) : ( <div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhum paciente para analisar.</p></div>)}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 xl:col-span-3">
              <CardHeader>
                <CardTitle>Distribuição por Plano de Saúde</CardTitle>
                <CardDescription>Pacientes por plano de saúde ou particular.</CardDescription>
              </CardHeader>
              <CardContent>
                 {isLoading ? <Skeleton className="h-64 w-full" /> : demographicsData.healthPlanData.length > 0 ? (
                  <ChartContainer config={healthPlanChartConfig} className="mx-auto aspect-square max-h-[300px]">
                    <ChartPie data={demographicsData.healthPlanData} nameKey="plan" dataKey="count">
                      <ChartTooltip content={<ChartTooltipContent nameKey="plan" hideLabel />} />
                    </ChartPie>
                  </ChartContainer>
                ) : ( <div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhum paciente para analisar.</p></div>)}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 xl:col-span-3">
              <CardHeader>
                <CardTitle>Top 10 Diagnósticos</CardTitle>
                <CardDescription>Os diagnósticos mais comuns entre os pacientes.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : demographicsData.diagnosisData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>Diagnóstico</TableHead>
                        <TableHead className="text-right">Nº de Pacientes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demographicsData.diagnosisData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="capitalize">{item.diagnosis}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (<div className="flex h-64 items-center justify-center text-muted-foreground"><p>Nenhum diagnóstico informado para os pacientes.</p></div>)}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

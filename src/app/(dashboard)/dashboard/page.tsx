
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, HeartPulse, CalendarCheck, Activity, CalendarClock, User } from 'lucide-react';
import { usePatient } from '@/contexts/PatientContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, startOfMonth, endOfMonth, isWithinInterval, parseISO, compareAsc } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppointmentsChart } from '@/components/dashboard/appointments-chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDisplayAvatarUrl } from '@/lib/utils';
import type { Appointment } from '@/lib/types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading: boolean;
  description?: string;
}

function StatCard({ title, value, icon: Icon, loading, description }: StatCardProps) {
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

export default function DashboardPage() {
  const { patients, loading: patientsLoading } = usePatient();
  const { appointments, loading: scheduleLoading } = useSchedule();
  const { users, loading: usersLoading } = useUser();
  const { currentUser } = useAuth();
  const { selectedUnitId } = useUnit();
  
  const loading = patientsLoading || scheduleLoading || usersLoading;

  const stats = React.useMemo(() => {
    if (loading || !currentUser) {
      return {
        todaysAppointmentsTotal: 0,
        myTodaysAppointments: 0,
        myMonthlyAppointments: 0,
        totalActivePatients: 0,
        totalTherapists: 0,
        myActivePatientsCount: 0,
      };
    }

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Therapist-specific calculations
    const myAppointments = appointments.filter(a => a.professionalName === currentUser.name);
    const myPatientIds = [...new Set(myAppointments.map(a => a.patientId))];
    const myActivePatientsCount = patients.filter(p => p.status === 'Active' && myPatientIds.includes(p.id)).length;
    
    // General calculations
    const totalActivePatients = patients.filter(p => p.status === 'Active').length;
    const totalTherapists = users.filter(u => u.role === 'Therapist' && selectedUnitId && Array.isArray(u.unitIds) && u.unitIds.includes(selectedUnitId)).length;
    const todaysAppointmentsTotal = appointments.filter(a => isToday(new Date(a.date + 'T00:00:00'))).length;
    const myTodaysAppointments = myAppointments.filter(a => isToday(new Date(a.date + 'T00:00:00'))).length;
    const myMonthlyAppointments = myAppointments.filter(a => isWithinInterval(new Date(a.date + 'T00:00:00'), { start: monthStart, end: monthEnd })).length;

    return {
      todaysAppointmentsTotal,
      myTodaysAppointments,
      myMonthlyAppointments,
      totalActivePatients,
      totalTherapists,
      myActivePatientsCount,
    };
  }, [appointments, patients, users, currentUser, loading, selectedUnitId]);

  const upcomingAppointments = React.useMemo(() => {
    if (loading || !currentUser) return [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return appointments
      .filter(a => {
        try {
            const appointmentDate = parseISO(`${a.date}T${a.time}:00`);
            return compareAsc(appointmentDate, todayStart) >= 0 && (currentUser?.role !== 'Therapist' || a.professionalName === currentUser.name);
        } catch (e) {
            console.error("Invalid date format for appointment:", a.id);
            return false;
        }
      })
      .sort((a, b) => {
        const dateA = parseISO(`${a.date}T${a.time}:00`);
        const dateB = parseISO(`${b.date}T${b.time}:00`);
        return compareAsc(dateA, dateB);
      })
      .slice(0, 5);
  }, [appointments, currentUser, loading]);

  const renderContentForRole = () => {
    if (currentUser?.role === 'Therapist') {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Meus Agendamentos de Hoje" value={stats.myTodaysAppointments} icon={CalendarCheck} loading={loading} description="Sessões agendadas para hoje" />
          <StatCard title="Meus Atendimentos no Mês" value={stats.myMonthlyAppointments} icon={Activity} loading={loading} description="Total de sessões realizadas este mês" />
          <StatCard title="Meus Pacientes Ativos" value={stats.myActivePatientsCount} icon={HeartPulse} loading={loading} description="Pacientes sob seus cuidados" />
        </div>
      );
    }
    // Default view for Admin, Coordinator, Receptionist
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pacientes Ativos" value={stats.totalActivePatients} icon={HeartPulse} loading={loading} description="Total de pacientes na unidade" />
        <StatCard title="Agendamentos para Hoje" value={stats.todaysAppointmentsTotal} icon={CalendarCheck} loading={loading} description="Sessões agendadas para hoje" />
        <StatCard title="Terapeutas na Unidade" value={stats.totalTherapists} icon={Users} loading={loading} description="Profissionais ativos na unidade" />
      </div>
    );
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
           {currentUser ? `Bem-vindo(a) de volta, ${currentUser.name}!` : 'Bem-vindo(a)!'}
        </h1>
        <p className="text-muted-foreground">
          Tudo pronto para um dia produtivo.
        </p>
      </div>

      {renderContentForRole()}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Atendimentos por Disciplina</CardTitle>
            <CardDescription>Visão geral dos atendimentos realizados na unidade no último mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentsChart appointments={appointments} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Seus próximos agendamentos na unidade.</CardDescription>
            </CardHeader>
            <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : 
             upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                    {upcomingAppointments.map(app => {
                        const patient = patients.find(p => p.id === app.patientId);
                        return (
                            <div key={app.id} className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarImage src={getDisplayAvatarUrl(patient?.avatarUrl)} alt={patient?.name || 'Avatar do Paciente'} data-ai-hint="person portrait" />
                                    <AvatarFallback>{patient ? getInitials(patient.name) : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{app.patientName}</p>
                                    <p className="text-sm text-muted-foreground">{app.professionalName}</p>
                                </div>
                                <div className="text-right">
                                     <Badge variant="outline">{format(parseISO(`${app.date}T${app.time}`), 'dd/MM, HH:mm')}</Badge>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg h-full">
                    <CalendarClock className="h-10 w-10 text-muted-foreground mb-2"/>
                    <p className="text-muted-foreground">Nenhum agendamento futuro encontrado.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

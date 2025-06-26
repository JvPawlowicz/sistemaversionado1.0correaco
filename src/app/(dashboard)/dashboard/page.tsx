'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, HeartPulse, CalendarCheck, Activity } from 'lucide-react';
import { usePatient } from '@/contexts/PatientContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { AppointmentsChart } from '@/components/dashboard/appointments-chart';

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

  // --- Data Calculations ---
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // General Stats (for Admin/Coordinator/Receptionist)
  const totalActivePatients = patients.filter(p => p.status === 'Active').length;
  const todaysAppointmentsTotal = appointments.filter(a => isToday(new Date(a.date + 'T00:00:00'))).length;
  const totalTherapists = users.filter(u => u.role === 'Therapist' && selectedUnitId && u.unitIds.includes(selectedUnitId)).length;

  // Therapist-specific Stats
  const myAppointments = appointments.filter(a => a.professionalName === currentUser?.name);
  const myTodaysAppointments = myAppointments.filter(a => isToday(new Date(a.date + 'T00:00:00'))).length;
  const myMonthlyAppointments = myAppointments.filter(a => isWithinInterval(new Date(a.date + 'T00:00:00'), { start: monthStart, end: monthEnd })).length;
  const myPatientIds = [...new Set(myAppointments.map(a => a.patientId))];
  const myActivePatientsCount = patients.filter(p => p.status === 'Active' && myPatientIds.includes(p.id)).length;


  const renderContentForRole = () => {
    if (currentUser?.role === 'Therapist') {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Meus Agendamentos de Hoje" value={myTodaysAppointments} icon={CalendarCheck} loading={loading} description="Sessões agendadas para hoje" />
          <StatCard title="Meus Atendimentos no Mês" value={myMonthlyAppointments} icon={Activity} loading={loading} description="Total de sessões realizadas este mês" />
          <StatCard title="Meus Pacientes Ativos" value={myActivePatientsCount} icon={HeartPulse} loading={loading} description="Pacientes sob seus cuidados" />
        </div>
      );
    }
    // Default view for Admin, Coordinator, Receptionist
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pacientes Ativos" value={totalActivePatients} icon={HeartPulse} loading={loading} description="Total de pacientes na unidade" />
        <StatCard title="Agendamentos para Hoje" value={todaysAppointmentsTotal} icon={CalendarCheck} loading={loading} description="Sessões agendadas para hoje" />
        <StatCard title="Terapeutas na Unidade" value={totalTherapists} icon={Users} loading={loading} description="Profissionais ativos na unidade" />
      </div>
    );
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
            <p className="text-center text-muted-foreground py-8">(Em breve)</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

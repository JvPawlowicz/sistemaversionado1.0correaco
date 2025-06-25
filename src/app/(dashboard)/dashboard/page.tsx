'use client';

import * as React from 'react';
import { ScheduleCalendar } from '@/components/dashboard/schedule-calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, HeartPulse, CalendarCheck } from 'lucide-react';
import { usePatient } from '@/contexts/PatientContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

function StatCard({ title, value, icon: Icon, loading }: { title: string; value: string | number; icon: React.ElementType; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-1/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
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

  const totalPatients = patients.filter(p => p.status === 'Active').length;
  const todaysAppointments = appointments.filter(a => isToday(new Date(a.date + 'T00:00:00'))).length;
  const totalTherapists = users.filter(u => u.role === 'Therapist' && selectedUnitId && u.unitIds.includes(selectedUnitId)).length;

  const loading = patientsLoading || scheduleLoading || usersLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
           {currentUser ? `Bem-vindo(a) de volta, ${currentUser.name}!` : 'Bem-vindo(a)!'}
        </h1>
        <p className="text-muted-foreground">
          Aqui está um resumo da sua clínica.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pacientes Ativos" value={totalPatients} icon={HeartPulse} loading={loading} />
        <StatCard title="Agendamentos para Hoje" value={todaysAppointments} icon={CalendarCheck} loading={loading} />
        <StatCard title="Terapeutas na Unidade" value={totalTherapists} icon={Users} loading={loading} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Agenda Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleCalendar />
        </CardContent>
      </Card>
    </div>
  );
}

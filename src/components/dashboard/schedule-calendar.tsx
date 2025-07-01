'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Appointment } from '@/lib/types';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Skeleton } from '@/components/ui/skeleton';

export function ScheduleCalendar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [todaysAppointments, setTodaysAppointments] = React.useState<Appointment[]>([]);
  const { appointments, loading } = useSchedule();

  React.useEffect(() => {
    if (date) {
      const filteredAppointments = appointments.filter(
        (appointment) => {
          const appointmentDate = new Date(appointment.date + 'T00:00:00'); // To handle timezone
          return appointmentDate.getDate() === date.getDate() &&
                 appointmentDate.getMonth() === date.getMonth() &&
                 appointmentDate.getFullYear() === date.getFullYear()
        }
      );
      setTodaysAppointments(filteredAppointments);
    }
  }, [date, appointments]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border self-start"
      />
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos para {date ? date.toLocaleDateString('pt-BR') : 'hoje'}</CardTitle>
          <CardDescription>Você tem {todaysAppointments.length} agendamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {todaysAppointments.length > 0 ? (
                todaysAppointments.sort((a,b) => a.time.localeCompare(b.time)).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                    <div>
                      <p className="font-semibold">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.time} - Sala {appointment.room}</p>
                    </div>
                    <Badge variant={appointment.discipline === 'Physiotherapy' ? 'default' : 'secondary'}>{appointment.discipline}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum agendamento para este dia.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

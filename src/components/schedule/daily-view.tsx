'use client';

import * as React from 'react';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AppointmentActionsDialog } from './appointment-actions-dialog';

const HOUR_HEIGHT = 60; // height of one hour in pixels

const timeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// This function calculates the layout for appointments on a given day to handle overlaps.
function calculateAppointmentLayout(appointmentsOnDay: Appointment[]) {
  if (!appointmentsOnDay || appointmentsOnDay.length === 0) {
    return [];
  }

  const sortedApps = [...appointmentsOnDay].sort((a, b) => {
    const startDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });

  const withLayout = sortedApps.map(app => ({
    ...app,
    layout: { col: 0, totalCols: 1 },
  }));

  for (let i = 0; i < withLayout.length; i++) {
    const currentApp = withLayout[i];
    let column = 0;
    let placed = false;
    while (!placed) {
      let hasOverlapInColumn = false;
      for (let j = 0; j < i; j++) {
        const prevApp = withLayout[j];
        if (prevApp.layout.col === column) {
          if (timeToMinutes(currentApp.time) < timeToMinutes(prevApp.endTime)) {
            hasOverlapInColumn = true;
            break;
          }
        }
      }
      if (!hasOverlapInColumn) {
        currentApp.layout.col = column;
        placed = true;
      } else {
        column++;
      }
    }
  }
  
  for (let i = 0; i < withLayout.length; i++) {
      const app1 = withLayout[i];
      let groupMaxCols = app1.layout.col + 1;
       for (let j = 0; j < withLayout.length; j++) {
           const app2 = withLayout[j];
            if (timeToMinutes(app1.time) < timeToMinutes(app2.endTime) && timeToMinutes(app1.endTime) > timeToMinutes(app2.time)) {
                groupMaxCols = Math.max(groupMaxCols, app2.layout.col + 1);
            }
       }
       app1.layout.totalCols = groupMaxCols;
  }

   for (let i = 0; i < withLayout.length; i++) {
      const app1 = withLayout[i];
      let finalMaxCols = app1.layout.totalCols;
       for (let j = 0; j < withLayout.length; j++) {
           if (i === j) continue;
           const app2 = withLayout[j];
            if (timeToMinutes(app1.time) < timeToMinutes(app2.endTime) && timeToMinutes(app1.endTime) > timeToMinutes(app2.time)) {
                finalMaxCols = Math.max(finalMaxCols, app2.layout.totalCols)
            }
       }
       app1.layout.totalCols = finalMaxCols;
  }

  return withLayout;
}


export function DailyView({ appointments, currentDate, setCurrentDate }: { appointments: Appointment[], currentDate: Date, setCurrentDate: (date: Date) => void }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon to Fri

  const { currentUser } = useAuth();
  const [isActionsDialogOpen, setIsActionsDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

  const laidOutAppointmentsByDay = React.useMemo(() => {
    const dayMap = new Map<string, (Appointment & { layout: { col: number; totalCols: number } })[]>();
    days.forEach(day => {
      const appointmentsOnDay = appointments.filter(appointment =>
        isSameDay(new Date(appointment.date + 'T00:00:00'), day)
      );
      dayMap.set(day.toISOString(), calculateAppointmentLayout(appointmentsOnDay));
    });
    return dayMap;
  }, [appointments, days]);


  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsActionsDialogOpen(true);
  };
  
  return (
    <>
      <AppointmentActionsDialog
        isOpen={isActionsDialogOpen}
        onOpenChange={setIsActionsDialogOpen}
        appointment={selectedAppointment}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 4), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>Hoje</Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex">
            <div className="w-16 flex-shrink-0">
              <div className="h-10"></div>
              {hours.map(hour => (
                <div key={hour} className="h-[60px] text-right pr-2 text-xs text-muted-foreground border-t border-border pt-1">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 flex-grow min-w-[800px]">
              {days.map(day => (
                <div key={day.toISOString()} className="text-center font-semibold p-2 border-b border-border">
                  <p className="text-sm uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                  <p className="text-lg font-normal text-muted-foreground">{format(day, 'dd')}</p>
                </div>
              ))}
              {days.map(day => (
                <div key={day.toISOString()} className="relative border-r border-border bg-background">
                  {hours.map((hour, index) => (
                      <div key={hour} className={`h-[60px] ${index > 0 ? 'border-t border-border/70' : ''}`}></div>
                  ))}
                  {(laidOutAppointmentsByDay.get(day.toISOString()) || []).map(app => {
                    const top = ((timeToMinutes(app.time) - 7 * 60) / 60) * HOUR_HEIGHT + 1;
                    const height = ((timeToMinutes(app.endTime) - timeToMinutes(app.time)) / 60) * HOUR_HEIGHT - 2;

                    const widthPercentage = 100 / app.layout.totalCols;
                    const leftPercentage = app.layout.col * widthPercentage;

                    const canInteract = currentUser && (
                        currentUser.role === 'Admin' ||
                        currentUser.role === 'Coordinator' ||
                        currentUser.role === 'Receptionist' ||
                        (currentUser.role === 'Therapist' && currentUser.name === app.professionalName)
                    );
                    
                    const isPastAndPending = new Date() > new Date(`${app.date}T${app.endTime}`) && app.status === 'Agendado';

                    return (
                      <div
                        key={app.id}
                        onClick={() => canInteract && handleAppointmentClick(app)}
                        className={cn(
                          "absolute p-2 rounded-lg text-white overflow-hidden text-xs shadow-md transition-all",
                          canInteract ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed",
                          (app.status === 'Faltou' || app.status === 'Cancelado') && "opacity-60",
                          app.status === 'Cancelado' && "line-through",
                           isPastAndPending && "ring-2 ring-offset-1 ring-yellow-400"
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          width: `calc(${widthPercentage}% - 4px)`,
                          left: `calc(${leftPercentage}% + 2px)`,
                          zIndex: app.layout.col,
                          backgroundColor: app.color,
                        }}
                      >
                        <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{app.patientName}</p>
                        <p className="whitespace-nowrap overflow-hidden text-ellipsis">{app.professionalName}</p>
                        <p className="opacity-80 mt-1">{app.time} - {app.endTime}</p>
                        <div className="absolute bottom-1 right-1 bg-black/20 text-white text-[10px] px-1.5 rounded-sm">
                            {app.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

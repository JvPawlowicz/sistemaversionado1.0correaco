'use client';

import * as React from 'react';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HOUR_HEIGHT = 60; // height of one hour in pixels

const timeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function DailyView({ appointments }: { appointments: Appointment[] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday

  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon to Fri

  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(appointment => isSameDay(appointment.date, day));
  };

  return (
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
                {getAppointmentsForDay(day).map(app => {
                  const top = ((timeToMinutes(app.time) - 7 * 60) / 60) * HOUR_HEIGHT + 1;
                  const height = ((timeToMinutes(app.endTime) - timeToMinutes(app.time)) / 60) * HOUR_HEIGHT - 2;
                  
                  return (
                    <div
                      key={app.id}
                      className="absolute w-full p-2 rounded-lg text-white overflow-hidden text-xs shadow-md"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: app.color,
                        left: '4px',
                        width: 'calc(100% - 8px)'
                      }}
                    >
                      <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{app.patientName}</p>
                      <p className="whitespace-nowrap overflow-hidden text-ellipsis">{app.professionalName}</p>
                      <p className="opacity-80 mt-1">{app.time} - {app.endTime}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

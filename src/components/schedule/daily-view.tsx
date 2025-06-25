'use client';

import * as React from 'react';
import type { Appointment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, parse, isSameDay } from 'date-fns';

export function DailyView({ appointments }: { appointments: Appointment[] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // Show hours from 8 AM to 7 PM (19:00)
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); 

  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter(appointment => {
      if (!isSameDay(appointment.date, currentDate)) {
        return false;
      }
      const appointmentHour = parse(appointment.time, 'HH:mm', new Date()).getHours();
      return appointmentHour === hour;
    });
  };

  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{format(currentDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="relative grid grid-flow-col auto-cols-max gap-4 pb-4">
          {hours.map(hour => (
            <div key={hour} className="w-64">
              <div className="mb-2 text-center font-semibold text-muted-foreground">{`${hour.toString().padStart(2, '0')}:00`}</div>
              <div className="space-y-2 rounded-lg bg-muted p-2 min-h-[120px] border">
                {getAppointmentsForHour(hour).length > 0 ? (
                    getAppointmentsForHour(hour).map(app => (
                        <div key={app.id} className="rounded-lg border bg-card p-3 shadow-sm">
                            <p className="font-semibold text-sm">{app.patientName}</p>
                            <p className="text-xs text-muted-foreground">{app.time}</p>
                            <Badge variant={app.discipline === 'Physiotherapy' ? 'default' : 'secondary'} className="mt-1 text-xs">
                                {app.discipline}
                            </Badge>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

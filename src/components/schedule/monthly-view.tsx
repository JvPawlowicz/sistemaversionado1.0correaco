'use client';

import * as React from 'react';
import type { Appointment } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isSameDay } from 'date-fns';

export function MonthlyView({ appointments }: { appointments: Appointment[] }) {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    
    const selectedDayAppointments = React.useMemo(() => {
        if (!date) return [];
        return appointments.filter(app => isSameDay(app.date, date));
    }, [date, appointments]);
    
    const daysWithAppointments = React.useMemo(() => {
        return appointments.map(app => app.date);
    }, [appointments]);
    
    return (
        <Card>
            <CardContent className="grid gap-6 md:grid-cols-2 p-4 md:p-6">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border self-start"
                    modifiers={{ withAppointments: daysWithAppointments }}
                    modifiersClassNames={{ withAppointments: 'has-appointment' }}
                />
                 <div className="space-y-4">
                    <CardHeader className="p-0">
                        <CardTitle>Agendamentos para {date ? date.toLocaleDateString('pt-BR') : 'hoje'}</CardTitle>
                        <CardDescription>{selectedDayAppointments.length} agendamento(s) marcados.</CardDescription>
                    </CardHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                        {selectedDayAppointments.length > 0 ? (
                            selectedDayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((appointment) => (
                                <div key={appointment.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                                    <div>
                                        <p className="font-semibold text-sm">{appointment.patientName}</p>
                                        <p className="text-sm text-muted-foreground">{appointment.time} - Sala {appointment.room}</p>
                                    </div>
                                    <Badge variant={appointment.discipline === 'Physiotherapy' ? 'default' : 'secondary'}>{appointment.discipline}</Badge>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full min-h-[100px] text-center text-muted-foreground py-8">
                                <p>Nenhum agendamento para este dia.</p>
                            </div>
                        )}
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
}

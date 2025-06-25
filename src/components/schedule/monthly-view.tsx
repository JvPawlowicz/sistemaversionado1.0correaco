'use client';

import * as React from 'react';
import type { Appointment } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isSameDay } from 'date-fns';

export function MonthlyView({ appointments, date, setDate }: { appointments: Appointment[], date: Date, setDate: (date: Date) => void }) {
    
    const selectedDayAppointments = React.useMemo(() => {
        return appointments.filter(app => isSameDay(new Date(app.date + 'T00:00:00'), date));
    }, [date, appointments]);
    
    const daysWithAppointments = React.useMemo(() => {
        return appointments.map(app => new Date(app.date + 'T00:00:00'));
    }, [appointments]);
    
    return (
        <Card>
            <CardContent className="grid gap-6 md:grid-cols-2 p-4 md:p-6">
                 <Calendar
                    mode="single"
                    required
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    className="rounded-md border self-start"
                    modifiers={{ withAppointments: daysWithAppointments }}
                    modifiersClassNames={{ withAppointments: 'has-appointment' }}
                />
                 <div className="space-y-4">
                    <CardHeader className="p-0">
                        <CardTitle>Agendamentos para {date.toLocaleDateString('pt-BR')}</CardTitle>
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

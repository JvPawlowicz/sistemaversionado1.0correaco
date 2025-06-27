'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PlusCircle, Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyView } from './daily-view';
import { MonthlyView } from './monthly-view';
import { useSchedule } from '@/contexts/ScheduleContext';
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { NewAppointmentDialog } from './new-appointment-dialog';
import type { Appointment } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function ScheduleView() {
  const [activeTab, setActiveTab] = React.useState('week');
  const [isExporting, setIsExporting] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { appointments, timeBlocks, loading, error } = useSchedule();

  const handleExportPdf = async () => {
    setIsExporting(true);
    
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const primaryColor = [63, 76, 181];

    const getAppointmentsForExport = (): Appointment[] => {
      if (activeTab === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return appointments
            .filter(app => isWithinInterval(new Date(app.date + 'T00:00:00'), { start: weekStart, end: weekEnd }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
      } else {
        return appointments
            .filter(app => isSameDay(new Date(app.date + 'T00:00:00'), currentDate))
            .sort((a, b) => a.time.localeCompare(b.time));
      }
    };

    const appointmentsToExport = getAppointmentsForExport();
    
    let title: string;
    let head: string[][];
    let body: string[][];

    if (activeTab === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        title = `Agenda da Semana: ${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`;
        head = [['Data', 'Horário', 'Paciente', 'Profissional', 'Sala']];
        body = appointmentsToExport.map(app => [
            format(new Date(app.date + 'T00:00:00'), 'eeee, dd/MM', { locale: ptBR }),
            `${app.time} - ${app.endTime}`,
            app.patientName,
            app.professionalName,
            `Sala ${app.room}`
        ]);
    } else {
        title = `Agenda do Dia: ${format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}`;
        head = [['Horário', 'Paciente', 'Profissional', 'Sala']];
        body = appointmentsToExport.map(app => [
            `${app.time} - ${app.endTime}`,
            app.patientName,
            app.professionalName,
            `Sala ${app.room}`
        ]);
    }
    
    doc.text(title, 14, 16);
    (doc as any).autoTable({
        startY: 22,
        head: head,
        body: body,
        headStyles: { fillColor: primaryColor },
        theme: 'grid',
    });

    doc.save('agenda.pdf');
    setIsExporting(false);
  };

  return (
    <div className="space-y-4">
        <NewAppointmentDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
        <Tabs defaultValue="week" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
                <TabsList>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Agendamento
                    </Button>
                    <Button onClick={handleExportPdf} disabled={isExporting || appointments.length === 0} variant="outline">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Exportar PDF
                    </Button>
                </div>
            </div>
            {loading ? (
                <Card><CardContent className="p-6"><Skeleton className="h-[500px] w-full" /></CardContent></Card>
            ) : error ? (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <>
                    <TabsContent value="week" >
                        <DailyView appointments={appointments} timeBlocks={timeBlocks} currentDate={currentDate} setCurrentDate={setCurrentDate} />
                    </TabsContent>
                    <TabsContent value="month">
                        <MonthlyView appointments={appointments} date={currentDate} setDate={setCurrentDate} />
                    </TabsContent>
                </>
            )}
        </Tabs>
    </div>
  );
}

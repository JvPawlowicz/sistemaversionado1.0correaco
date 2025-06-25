'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyView } from './daily-view';
import { MonthlyView } from './monthly-view';
import { appointments } from '@/lib/placeholder-data';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ScheduleView() {
  const [activeTab, setActiveTab] = React.useState('week');
  const [isExporting, setIsExporting] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());

  const handleExportPdf = () => {
    setIsExporting(true);
    
    const doc = new jsPDF();
    const primaryColor = [63, 76, 181];

    if (activeTab === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        const title = `Agenda da Semana: ${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`;
        
        const weekAppointments = appointments
            .filter(app => isWithinInterval(app.date, { start: weekStart, end: weekEnd }))
            .sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));

        const body = weekAppointments.map(app => [
            format(app.date, 'eeee, dd/MM', { locale: ptBR }),
            `${app.time} - ${app.endTime}`,
            app.patientName,
            app.professionalName,
            `Sala ${app.room}`
        ]);
        
        doc.text(title, 14, 16);
        (doc as any).autoTable({
            startY: 22,
            head: [['Data', 'Horário', 'Paciente', 'Profissional', 'Sala']],
            body: body,
            headStyles: { fillColor: primaryColor },
            theme: 'grid',
        });

    } else {
        const title = `Agenda do Dia: ${format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}`;

        const dayAppointments = appointments
            .filter(app => isSameDay(app.date, currentDate))
            .sort((a, b) => a.time.localeCompare(b.time));

        const body = dayAppointments.map(app => [
            `${app.time} - ${app.endTime}`,
            app.patientName,
            app.professionalName,
            `Sala ${app.room}`
        ]);
        
        doc.text(title, 14, 16);
        (doc as any).autoTable({
            startY: 22,
            head: [['Horário', 'Paciente', 'Profissional', 'Sala']],
            body: body,
            headStyles: { fillColor: primaryColor },
            theme: 'grid',
        });
    }

    doc.save('agenda.pdf');
    setIsExporting(false);
  };

  return (
    <div className="space-y-4">
        <Tabs defaultValue="week" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between pb-4">
                <TabsList>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
                 <Button onClick={handleExportPdf} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar PDF
                </Button>
            </div>
            <TabsContent value="week" >
                <DailyView appointments={appointments} currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </TabsContent>
            <TabsContent value="month">
                <MonthlyView appointments={appointments} date={currentDate} setDate={setCurrentDate} />
            </TabsContent>
        </Tabs>
    </div>
  );
}

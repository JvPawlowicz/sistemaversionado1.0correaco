
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { usePatient } from '@/contexts/PatientContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Patient, EvolutionRecord, Appointment } from '@/lib/types';
import { format, isWithinInterval, startOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Download, FileSignature } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
    const { patients, loading: patientsLoading } = usePatient();
    const { appointments, loading: scheduleLoading } = useSchedule();
    const { toast } = useToast();

    const [selectedPatientId, setSelectedPatientId] = React.useState<string>('');
    const [reportType, setReportType] = React.useState<string>('');
    const [startDate, setStartDate] = React.useState<Date>(subDays(new Date(), 30));
    const [endDate, setEndDate] = React.useState<Date>(new Date());
    
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedReport, setGeneratedReport] = React.useState<string>('');
    
    const isLoading = patientsLoading || scheduleLoading;
    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const generateEvolutionReport = async () => {
        if (!selectedPatient) return '';

        let reportContent = `RELATÓRIO DE EVOLUÇÃO\n\n`;
        reportContent += `Paciente: ${selectedPatient.name}\n`;
        reportContent += `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}\n\n`;
        reportContent += `--------------------------------------------------\n\n`;
        
        const recordsCollectionRef = collection(db, 'patients', selectedPatient.id, 'evolutionRecords');
        const q = query(recordsCollectionRef, where('createdAt', '>=', startOfDay(startDate)), where('createdAt', '<=', endDate), orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => doc.data() as EvolutionRecord);

        if (records.length === 0) {
            reportContent += 'Nenhum registro de evolução encontrado para o período selecionado.';
        } else {
            records.forEach(record => {
                reportContent += `Data: ${format(record.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}\n`;
                reportContent += `Título: ${record.title}\n`;
                reportContent += `Profissional: ${record.author}\n\n`;
                reportContent += `${record.details}\n\n`;
                reportContent += `--------------------------------------------------\n\n`;
            });
        }
        
        return reportContent;
    }

    const generateFrequencyReport = async () => {
         if (!selectedPatient) return '';
        
        const patientAppointments = appointments.filter(app => 
            app.patientId === selectedPatientId && 
            isWithinInterval(new Date(app.date + 'T00:00:00'), { start: startDate, end: endDate })
        );
        
        let reportContent = `RELATÓRIO DE FREQUÊNCIA\n\n`;
        reportContent += `Paciente: ${selectedPatient.name}\n`;
        reportContent += `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}\n\n`;

        const total = patientAppointments.length;
        const realizados = patientAppointments.filter(a => a.status === 'Realizado').length;
        const faltas = patientAppointments.filter(a => a.status === 'Faltou').length;
        const cancelados = patientAppointments.filter(a => a.status === 'Cancelado').length;
        const agendados = patientAppointments.filter(a => a.status === 'Agendado').length;
        const presencaPercent = total > 0 && (total - cancelados > 0) ? ((realizados / (total - cancelados)) * 100).toFixed(1) : '0.0';

        reportContent += `Resumo:\n`;
        reportContent += `- Total de Sessões (excluindo cancelados): ${total - cancelados}\n`;
        reportContent += `- Sessões Realizadas: ${realizados}\n`;
        reportContent += `- Faltas: ${faltas}\n`;
        reportContent += `- Próximas (Agendado): ${agendados}\n`;
        reportContent += `- Sessões Canceladas: ${cancelados}\n`;
        reportContent += `- Taxa de Presença: ${presencaPercent}%\n\n`;
        
        reportContent += `--------------------------------------------------\n\n`;
        reportContent += `Detalhes das Sessões:\n\n`;

        if (patientAppointments.length > 0) {
            patientAppointments
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .forEach(app => {
                    reportContent += `Data: ${format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy')} - ${app.time}\n`;
                    reportContent += `Serviço: ${app.serviceName}\n`;
                    reportContent += `Status: ${app.status}\n\n`;
                });
        } else {
            reportContent += "Nenhum agendamento encontrado para o período."
        }
        
        return reportContent;
    }

    const handleGenerateReport = async () => {
        if (!selectedPatientId || !reportType) {
            toast({ variant: 'destructive', title: 'Campos incompletos', description: 'Por favor, selecione um paciente e um tipo de relatório.'});
            return;
        }

        setIsGenerating(true);
        setGeneratedReport('');

        let report = '';
        try {
            if (reportType === 'evolution') {
                report = await generateEvolutionReport();
            } else if (reportType === 'frequency') {
                report = await generateFrequencyReport();
            }
            setGeneratedReport(report);
        } catch(e) {
            console.error("Error generating report", e);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o relatório.'});
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleExportPdf = async () => {
        if (!generatedReport || !selectedPatient) return;
        
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        const title = reportType === 'evolution' ? 'Relatório de Evolução' : 'Relatório de Frequência';

        doc.setFontSize(18);
        doc.text(title, 14, 22);

        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(generatedReport, 180);
        doc.text(splitText, 14, 32);
        
        doc.save(`relatorio_${selectedPatient.name.replace(/\s/g, '_')}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gerador de Relatórios Clínicos</h1>
                <p className="text-muted-foreground">Crie relatórios detalhados para pacientes, convênios e acompanhamento interno.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuração do Relatório</CardTitle>
                    <CardDescription>Selecione os parâmetros para gerar o relatório desejado.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                     <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium">Paciente</label>
                        <Select onValueChange={setSelectedPatientId} value={selectedPatientId} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium">Tipo de Relatório</label>
                        <Select onValueChange={setReportType} value={reportType}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="evolution">Relatório de Evolução</SelectItem>
                                <SelectItem value="frequency">Relatório de Frequência</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex flex-col space-y-2 col-span-full sm:col-span-2">
                        <label className="text-sm font-medium">Período</label>
                        <div className="flex items-center gap-2">
                            <DatePicker value={startDate} onChange={date => date && setStartDate(startOfDay(date))} />
                            <span className="text-muted-foreground">-</span>
                            <DatePicker value={endDate} onChange={date => date && setEndDate(startOfDay(date))} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleGenerateReport} disabled={isGenerating || isLoading}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <FileSignature className="mr-2" />
                        Gerar Relatório
                    </Button>
                </CardFooter>
            </Card>

            {isGenerating && (
                 <Card>
                    <CardContent className="p-8 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Gerando relatório, por favor aguarde...</p>
                    </CardContent>
                 </Card>
            )}

            {generatedReport && (
                <Card>
                    <CardHeader className="flex-row justify-between items-center">
                        <CardTitle>Rascunho do Relatório</CardTitle>
                        <Button variant="outline" onClick={handleExportPdf}>
                            <Download className="mr-2"/>
                            Exportar para PDF
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            value={generatedReport}
                            onChange={(e) => setGeneratedReport(e.target.value)}
                            rows={25}
                            className="font-mono text-xs"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

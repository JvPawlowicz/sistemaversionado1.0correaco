
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Receipt, Download } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useUnit } from '@/contexts/UnitContext';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  loading: boolean;
}

function StatCard({ title, value, icon: Icon, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-1/2 mt-1" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function FinancialPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { appointments, loading: scheduleLoading } = useSchedule();
    const { units, loading: unitsLoading } = useUnit();

    const [filters, setFilters] = React.useState<{
        startDate: Date | null,
        endDate: Date | null,
    }>({
        startDate: startOfDay(subDays(new Date(), 30)),
        endDate: endOfDay(new Date()),
    });
    
    const isLoading = scheduleLoading || unitsLoading || authLoading;

    const financialData = React.useMemo(() => {
        if (isLoading || !filters.startDate || !filters.endDate) {
            return { totalRevenue: 0, billedAppointments: [], billedAppointmentsCount: 0, averageTicket: 0 };
        }
        
        const appointmentsInPeriod = appointments.filter(app =>
            app.status === 'Realizado' && isWithinInterval(parseISO(app.date), { start: filters.startDate!, end: filters.endDate! })
        );

        let totalRevenue = 0;
        const billedAppointments = appointmentsInPeriod.map(app => {
            const unit = units.find(u => u.id === app.unitId);
            const service = unit?.services?.find(s => s.id === app.serviceId);
            const price = service?.price || 0;
            totalRevenue += price;
            return { ...app, price };
        });
        
        const billedAppointmentsCount = billedAppointments.length;
        const averageTicket = billedAppointmentsCount > 0 ? totalRevenue / billedAppointmentsCount : 0;

        billedAppointments.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));

        return { totalRevenue, billedAppointments, billedAppointmentsCount, averageTicket };
    }, [appointments, units, filters, isLoading]);

    const handleFilterChange = (key: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };
    
    if (authLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin"/></div>;

    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Coordinator') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acesso Negado</CardTitle>
                    <CardDescription>Você não tem permissão para visualizar esta página.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button onClick={() => router.push('/dashboard')}>Voltar para o Painel</Button>
                 </CardContent>
            </Card>
        );
    }

    const handleExportPdf = async () => {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDF();
        doc.text('Relatório de Receita', 14, 16);
        (doc as any).autoTable({
            startY: 22,
            head: [['Data', 'Paciente', 'Serviço', 'Profissional', 'Valor (R$)']],
            body: financialData.billedAppointments.map(app => [
                format(parseISO(app.date), 'dd/MM/yyyy'),
                app.patientName,
                app.serviceName,
                app.professionalName,
                app.price.toFixed(2)
            ]),
            headStyles: { fillColor: [63, 76, 181] },
            theme: 'grid',
            didDrawPage: (data: any) => {
                let str = `Total: ${formatCurrency(financialData.totalRevenue)}`;
                doc.setFontSize(10);
                let pageSize = doc.internal.pageSize;
                let pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            }
        });
        doc.save('relatorio_receita.pdf');
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Análise Financeira</h1>
                <p className="text-muted-foreground">Visualize a receita da clínica com base nos atendimentos realizados.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Receita Bruta" value={formatCurrency(financialData.totalRevenue)} icon={DollarSign} description="No período selecionado" loading={isLoading} />
                <StatCard title="Atendimentos Faturados" value={financialData.billedAppointmentsCount} icon={Receipt} description="Atendimentos realizados com preço definido" loading={isLoading} />
                <StatCard title="Ticket Médio" value={formatCurrency(financialData.averageTicket)} icon={TrendingUp} description="Valor médio por atendimento faturado" loading={isLoading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Relatório de Receita</CardTitle>
                    <CardDescription>Filtre os atendimentos realizados para visualizar a receita detalhada.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <DatePicker value={filters.startDate || undefined} onChange={date => date && handleFilterChange('startDate', startOfDay(date))} />
                            <span className="text-muted-foreground">-</span>
                            <DatePicker value={filters.endDate || undefined} onChange={date => date && handleFilterChange('endDate', endOfDay(date))} />
                        </div>
                        <Button onClick={handleExportPdf} variant="outline" disabled={financialData.billedAppointments.length === 0}><Download className="mr-2" /> Exportar PDF</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Receita</CardTitle>
                <CardDescription>{financialData.billedAppointments.length} atendimento(s) geraram receita no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="hidden md:table-cell">Profissional</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : financialData.billedAppointments.length > 0 ? (
                            financialData.billedAppointments.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell>{format(parseISO(app.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{app.patientName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{app.serviceName}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{app.professionalName}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(app.price)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhuma receita encontrada para o período.</TableCell></TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
        </div>
    );
}

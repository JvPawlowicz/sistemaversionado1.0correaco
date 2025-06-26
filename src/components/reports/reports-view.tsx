'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchedule } from '@/contexts/ScheduleContext';
import { usePatient } from '@/contexts/PatientContext';
import { useUser } from '@/contexts/UserContext';
import { useUnit } from '@/contexts/UnitContext';
import type { Appointment } from '@/lib/types';
import { addDays, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { Download, Loader2, SlidersHorizontal, Trash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ReportsView() {
  const { appointments, loading: scheduleLoading } = useSchedule();
  const { patients, loading: patientsLoading } = usePatient();
  const { users, loading: usersLoading } = useUser();
  const { units, selectedUnitId, loading: unitsLoading } = useUnit();

  const [filteredAppointments, setFilteredAppointments] = React.useState<Appointment[]>([]);
  const [filters, setFilters] = React.useState({
    startDate: addDays(new Date(), -30),
    endDate: new Date(),
    patientId: '',
    professionalName: '',
    room: '',
    status: '',
  });

  const isLoading = scheduleLoading || patientsLoading || usersLoading || unitsLoading;
  const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Coordinator' || u.role === 'Admin');
  const rooms = units.find(u => u.id === selectedUnitId)?.rooms || [];

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = React.useCallback(() => {
    let result = appointments;

    if (filters.startDate) {
      result = result.filter(app => isEqual(new Date(app.date), filters.startDate) || isAfter(new Date(app.date), filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter(app => isEqual(new Date(app.date), filters.endDate) || isBefore(new Date(app.date), filters.endDate));
    }
    if (filters.patientId) {
      result = result.filter(app => app.patientId === filters.patientId);
    }
    if (filters.professionalName) {
      result = result.filter(app => app.professionalName === filters.professionalName);
    }
    if (filters.room) {
      result = result.filter(app => app.room === filters.room);
    }
    if (filters.status) {
      result = result.filter(app => app.status === filters.status);
    }
    
    result.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    setFilteredAppointments(result);
  }, [appointments, filters]);
  
  const clearFilters = () => {
    setFilters({
        startDate: addDays(new Date(), -30),
        endDate: new Date(),
        patientId: '',
        professionalName: '',
        room: '',
        status: '',
    });
    setFilteredAppointments([]);
  };

  const handleExportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.text('Relatório de Agendamentos', 14, 16);
    
    (doc as any).autoTable({
        startY: 22,
        head: [['Data', 'Horário', 'Paciente', 'Profissional', 'Sala', 'Status']],
        body: filteredAppointments.map(app => [
            format(new Date(app.date + "T00:00:00"), 'dd/MM/yyyy', { locale: ptBR }),
            `${app.time} - ${app.endTime}`,
            app.patientName,
            app.professionalName,
            app.room,
            app.status
        ]),
        headStyles: { fillColor: [63, 76, 181] },
        theme: 'grid',
    });

    doc.save('relatorio_agendamentos.pdf');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <CardDescription>Selecione os critérios para gerar o relatório.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Período</label>
            <div className="flex items-center gap-2">
              <DatePicker value={filters.startDate} onChange={date => date && handleFilterChange('startDate', startOfDay(date))} />
              <span className="text-muted-foreground">-</span>
              <DatePicker value={filters.endDate} onChange={date => date && handleFilterChange('endDate', startOfDay(date))} />
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium">Paciente</label>
            <Select onValueChange={value => handleFilterChange('patientId', value)} value={filters.patientId} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium">Profissional</label>
            <Select onValueChange={value => handleFilterChange('professionalName', value)} value={filters.professionalName} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {professionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium">Sala</label>
            <Select onValueChange={value => handleFilterChange('room', value)} value={filters.room} disabled={isLoading || rooms.length === 0}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                 {rooms.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select onValueChange={value => handleFilterChange('status', value)} value={filters.status}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Realizado">Realizado</SelectItem>
                <SelectItem value="Faltou">Faltou</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 col-span-full sm:col-span-1 lg:col-span-2 xl:col-span-1">
             <Button onClick={applyFilters} className="w-full sm:w-auto flex-1">
                <SlidersHorizontal className="mr-2" />
                Aplicar Filtros
            </Button>
            <Button onClick={clearFilters} className="w-full sm:w-auto" variant="outline">
                <Trash className="mr-2" />
                Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>{filteredAppointments.length} registro(s) encontrado(s).</CardDescription>
            </div>
            <Button onClick={handleExportPdf} variant="outline" disabled={filteredAppointments.length === 0}>
                <Download className="mr-2" /> Exportar PDF
            </Button>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Profissional</TableHead>
                            <TableHead className="hidden md:table-cell">Sala</TableHead>
                            <TableHead className="hidden sm:table-cell">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : filteredAppointments.length > 0 ? (
                           filteredAppointments.map(app => (
                             <TableRow key={app.id}>
                                <TableCell>
                                    <div className="font-medium">{format(new Date(app.date + 'T00:00'), 'dd/MM/yyyy')}</div>
                                    <div className="text-sm text-muted-foreground">{`${app.time}-${app.endTime}`}</div>
                                </TableCell>
                                <TableCell>{app.patientName}</TableCell>
                                <TableCell>{app.professionalName}</TableCell>
                                <TableCell className="hidden md:table-cell">{app.room}</TableCell>
                                <TableCell className="hidden sm:table-cell"><Badge variant={app.status === 'Realizado' ? 'default' : 'secondary'}>{app.status}</Badge></TableCell>
                             </TableRow>
                           ))
                        ) : (
                             <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum resultado. Aplique os filtros para gerar um relatório.</TableCell></TableRow>
                        )}
                    </TableBody>
                 </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

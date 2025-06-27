'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function EvolutionsPage() {
  const { appointments, loading } = useSchedule();
  const [searchTerm, setSearchTerm] = React.useState('');

  const pendingEvolutions = React.useMemo(() => {
    return appointments
      .filter(app => app.status === 'Realizado')
      .filter(app => 
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.professionalName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Evoluções Pendentes
          </h1>
          <p className="text-muted-foreground">
            Acompanhe e registre as evoluções dos atendimentos realizados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por paciente ou profissional..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" disabled>Lembrar Selecionados</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos Realizados Aguardando Evolução</CardTitle>
          <CardDescription>
            Esta lista mostra os atendimentos concluídos. Clique em "Registrar" para adicionar a evolução no prontuário do paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead className="hidden md:table-cell">Profissional</TableHead>
                            <TableHead className="hidden sm:table-cell">Serviço</TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                        ) : pendingEvolutions.length > 0 ? (
                            pendingEvolutions.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell>{format(new Date(app.date + 'T00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                    <TableCell className="font-medium">{app.patientName}</TableCell>
                                    <TableCell className="hidden md:table-cell">{app.professionalName}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{app.serviceName}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/patients/${app.patientId}`}>
                                                <LinkIcon className="mr-2 h-3 w-3" />
                                                Registrar
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma evolução pendente encontrada.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-start gap-3 mt-4 p-3 rounded-lg bg-secondary/50 text-secondary-foreground">
                <AlertTriangle className="h-5 w-5 mt-1 flex-shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">Nota sobre a Lógica de Pendência</p>
                    <p className="text-muted-foreground">
                        Atualmente, a lista exibe todos os atendimentos marcados como "Realizado". A funcionalidade para remover automaticamente um item da lista após o registro da evolução está em desenvolvimento.
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

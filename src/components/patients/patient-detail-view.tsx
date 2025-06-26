'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Loader2 } from 'lucide-react';
import type { Patient, EvolutionRecord, Report } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { NewEvolutionRecordDialog } from './new-evolution-record-dialog';

// Reports are not implemented yet, so we keep this empty.
const reports: Report[] = [];

export function PatientDetailView({
  patient,
  records,
  recordsLoading,
  onRecordAdded,
}: {
  patient: Patient;
  records: EvolutionRecord[];
  recordsLoading: boolean;
  onRecordAdded: () => void;
}) {
  const [isNewRecordDialogOpen, setIsNewRecordDialogOpen] = React.useState(false);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <NewEvolutionRecordDialog
        isOpen={isNewRecordDialogOpen}
        onOpenChange={setIsNewRecordDialogOpen}
        patientId={patient.id}
        onRecordAdded={onRecordAdded}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col items-start gap-4 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarImage src={patient.avatarUrl} alt={patient.name} />
              <AvatarFallback className="text-3xl">{getInitials(patient.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl">{patient.name}</CardTitle>
              <CardDescription className="mt-2 text-base">
                ID do Paciente: {patient.id}
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Nasc: {patient.dob}</span>
                <span>Gênero: {patient.gender === 'Female' ? 'Feminino' : patient.gender === 'Male' ? 'Masculino' : 'Outro'}</span>
                <span>Telefone: {patient.phone}</span>
                <span>Email: {patient.email}</span>
              </div>
            </div>
            <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
              {patient.status === 'Active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardHeader>
        </Card>

        <Tabs defaultValue="evolution">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="profile">Perfil Completo</TabsTrigger>
          </TabsList>
          <TabsContent value="evolution">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Registros de Evolução</CardTitle>
                    <CardDescription>Registro cronológico do progresso e sessões do paciente.</CardDescription>
                  </div>
                  <Button onClick={() => setIsNewRecordDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Registro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {recordsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : records.length > 0 ? (
                    records.map(record => (
                      <div key={record.id} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{record.title}</h3>
                            <span className="text-sm text-muted-foreground">{record.date}</span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap">{record.details}</p>
                        <p className="mt-4 text-xs text-muted-foreground text-right">Por: {record.author}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum registro de evolução encontrado.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>Documentos oficiais e relatórios relacionados ao paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Button disabled>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Relatório
                  </Button>
                  {reports.length > 0 ? (
                    <ul className="space-y-2">
                        {reports.map(report => (
                            <li key={report.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary"/>
                                    <div>
                                        <p className="font-medium">{report.title}</p>
                                        <p className="text-sm text-muted-foreground">Gerado em {report.date}</p>
                                    </div>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={report.url}>Baixar</Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum relatório encontrado. (Funcionalidade em desenvolvimento)</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Perfil Completo do Paciente</CardTitle>
                <CardDescription>Todas as informações detalhadas do paciente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Nome Completo</p>
                        <p>{patient.name}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Data de Nascimento</p>
                        <p>{patient.dob}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Gênero</p>
                        <p>{patient.gender === 'Female' ? 'Feminino' : patient.gender === 'Male' ? 'Masculino' : 'Outro'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Status</p>
                        <p>{patient.status === 'Active' ? 'Ativo' : 'Inativo'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">E-mail</p>
                        <p>{patient.email}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Telefone</p>
                        <p>{patient.phone}</p>
                    </div>
                       <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Última visita</p>
                        <p>{patient.lastVisit}</p>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

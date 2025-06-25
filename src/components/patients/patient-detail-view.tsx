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
import { FileText, Plus } from 'lucide-react';
import type { Patient, EvolutionRecord, Report } from '@/lib/types';
import Link from 'next/link';

// NOTE: In a real app, records and reports would be fetched based on patient.id
const records: EvolutionRecord[] = [];
const reports: Report[] = [];

export function PatientDetailView({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start gap-4 sm:flex-row">
          <Avatar className="h-24 w-24">
            <AvatarImage src={patient.avatarUrl} alt={patient.name} />
            <AvatarFallback className="text-3xl">{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription className="mt-2 text-base">
              ID do Paciente: {patient.id}
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Nasc: {patient.dob}</span>
              <span>Gênero: {patient.gender === 'Female' ? 'Feminino' : 'Masculino'}</span>
              <span>Telefone: {patient.phone}</span>
              <span>Email: {patient.email}</span>
            </div>
          </div>
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
              <CardTitle>Registros de Evolução</CardTitle>
              <CardDescription>Registro cronológico do progresso e sessões do paciente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
              <div className="space-y-4">
                {records.length > 0 ? (
                  records.map(record => (
                    <div key={record.id} className="rounded-lg border bg-secondary p-4">
                      <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{record.title}</h3>
                          <span className="text-sm text-muted-foreground">{record.date}</span>
                      </div>
                      <p className="mt-2 text-sm">{record.details}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Por: {record.author}</p>
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
                <Button>
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
                    <p>Nenhum relatório encontrado.</p>
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
            <CardContent>
              <p>Informações detalhadas do perfil serão exibidas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

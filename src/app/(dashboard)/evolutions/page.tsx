'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, isAfter, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePatient } from '@/contexts/PatientContext';
import type { EvolutionRecord, Appointment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { NewEvolutionRecordDialog } from '@/components/patients/new-evolution-record-dialog';
import { createPendingEvolutionRemindersAction } from '@/lib/actions/notification';


export default function EvolutionsPage() {
  const { appointments, loading: scheduleLoading, fetchScheduleData } = useSchedule();
  const { patients, loading: patientsLoading } = usePatient();
  const [evolutionsByPatient, setEvolutionsByPatient] = React.useState<Map<string, EvolutionRecord[]>>(new Map());
  const [loadingEvolutions, setLoadingEvolutions] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedAppointments, setSelectedAppointments] = React.useState<string[]>([]);
  const { toast } = useToast();

  const [isRecordDialogOpen, setIsRecordDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [isSendingReminders, setIsSendingReminders] = React.useState(false);
  
  const loading = scheduleLoading || patientsLoading || loadingEvolutions;
  
  const attendedAppointments = React.useMemo(() => {
    return appointments.filter(app => app.status === 'Realizado');
  }, [appointments]);


  const fetchEvolutionsForAttended = React.useCallback(async () => {
    if (patientsLoading || attendedAppointments.length === 0) {
        setLoadingEvolutions(false);
        return;
    }

    if (!db) {
        console.error("Firestore DB is not initialized.");
        setLoadingEvolutions(false);
        return;
    }
    setLoadingEvolutions(true);
    const patientIdsToFetch = [...new Set(attendedAppointments.map(app => app.patientId))];
    const newEvolutionsMap = new Map<string, EvolutionRecord[]>();
    
    try {
        // Fetch evolutions only for patients who had attended appointments.
        const evolutionPromises = patientIdsToFetch.map(async (patientId) => {
            const recordsCollectionRef = collection(db, 'patients', patientId, 'evolutionRecords');
            const q = query(recordsCollectionRef);
            const querySnapshot = await getDocs(q);
            const fetchedRecords = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...(data as Omit<EvolutionRecord, 'id'>),
                };
            });
            newEvolutionsMap.set(patientId, fetchedRecords);
        });

        await Promise.all(evolutionPromises);
        setEvolutionsByPatient(newEvolutionsMap);
    } catch (error) {
        console.error("Error fetching evolution records: ", error);
    } finally {
        setLoadingEvolutions(false);
    }
  }, [attendedAppointments, patientsLoading]);

  React.useEffect(() => {
    fetchEvolutionsForAttended();
  }, [fetchEvolutionsForAttended]);


  const pendingEvolutions = React.useMemo(() => {
    return attendedAppointments.filter(app => {
      const patientEvolutions = evolutionsByPatient.get(app.patientId) || [];
      const appointmentDateTime = parseISO(`${app.date}T${app.time}`);
      
      const hasEvolutionAfter = patientEvolutions.some(evo => 
        evo.createdAt && (isAfter(evo.createdAt.toDate(), appointmentDateTime) || isEqual(evo.createdAt.toDate(), appointmentDateTime))
      );
      
      return !hasEvolutionAfter;
    })
    .filter(app => 
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.professionalName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendedAppointments, evolutionsByPatient, searchTerm]);
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedAppointments(pendingEvolutions.map(app => app.id));
    } else {
      setSelectedAppointments([]);
    }
  };
  
  const handleSelectOne = (appId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments(prev => [...prev, appId]);
    } else {
      setSelectedAppointments(prev => prev.filter(id => id !== appId));
    }
  };

  const handleSendReminders = async () => {
    if (selectedAppointments.length === 0) return;

    const appointmentsToSend = pendingEvolutions.filter(app => selectedAppointments.includes(app.id));
    if (appointmentsToSend.length === 0) return;
    
    setIsSendingReminders(true);
    const result = await createPendingEvolutionRemindersAction(
      appointmentsToSend.map(app => ({
        id: app.id,
        patientName: app.patientName,
        professionalName: app.professionalName,
        date: app.date,
      }))
    );
    setIsSendingReminders(false);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message
      });
      setSelectedAppointments([]);
    } else {
      toast({
        variant: 'destructive',
        title: "Erro ao enviar lembretes",
        description: result.message
      });
    }
  };
  
  const handleRegisterClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRecordDialogOpen(true);
  };
  
  const handleRecordAdded = async () => {
    await fetchEvolutionsForAttended();
    await fetchScheduleData();
  };

  const selectedPatientForDialog = React.useMemo(() => {
    if (!selectedAppointment) return null;
    return patients.find(p => p.id === selectedAppointment.patientId);
  }, [selectedAppointment, patients]);


  return (
    <>
      {selectedPatientForDialog && (
        <NewEvolutionRecordDialog
          isOpen={isRecordDialogOpen}
          onOpenChange={setIsRecordDialogOpen}
          patient={selectedPatientForDialog}
          onRecordAdded={handleRecordAdded}
        />
      )}
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
            <Button variant="outline" onClick={handleSendReminders} disabled={selectedAppointments.length === 0 || isSendingReminders}>
              {isSendingReminders && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lembrar Selecionados ({selectedAppointments.length})
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos Aguardando Evolução</CardTitle>
            <CardDescription>
              Esta lista mostra os atendimentos concluídos que ainda não tiveram uma evolução registrada na mesma data ou em data posterior.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedAppointments.length === pendingEvolutions.length && pendingEvolutions.length > 0}
                                    onCheckedChange={handleSelectAll}
                                  />
                              </TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Paciente</TableHead>
                              <TableHead className="hidden md:table-cell">Profissional</TableHead>
                              <TableHead className="hidden sm:table-cell">Serviço</TableHead>
                              <TableHead><span className="sr-only">Ações</span></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loading ? (
                              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                          ) : pendingEvolutions.length > 0 ? (
                              pendingEvolutions.map(app => (
                                  <TableRow key={app.id} data-state={selectedAppointments.includes(app.id) && "selected"}>
                                      <TableCell>
                                          <Checkbox
                                              checked={selectedAppointments.includes(app.id)}
                                              onCheckedChange={(checked) => handleSelectOne(app.id, checked as boolean)}
                                          />
                                      </TableCell>
                                      <TableCell>{format(new Date(app.date + 'T00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                      <TableCell className="font-medium">{app.patientName}</TableCell>
                                      <TableCell className="hidden md:table-cell">{app.professionalName}</TableCell>
                                      <TableCell className="hidden sm:table-cell">{app.serviceName}</TableCell>
                                      <TableCell className="text-right">
                                          <Button onClick={() => handleRegisterClick(app)} variant="outline" size="sm">
                                              <Edit className="mr-2 h-3 w-3" />
                                              Registrar
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma evolução pendente encontrada.</TableCell></TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useFormState } from 'react-dom';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/lib/types';
import { Calendar, Clock, User, Home, CheckCircle, XCircle, CircleAlert, Trash2, Stethoscope, ArrowLeft, Loader2, Shield, Edit, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { completeAppointmentWithEvolutionAction, updateAppointmentAction } from '@/lib/actions/schedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useUnit } from '@/contexts/UnitContext';

interface AppointmentActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment: Appointment | null;
}

const evolutionInitialState = {
  success: false,
  message: '',
  errors: null,
};

function EvolutionSubmitButton() {
  const { pending } = useFormState();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar e Concluir
    </Button>
  );
}

function EditSubmitButton() {
  const { pending } = useFormState();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Alterações
    </Button>
  );
}


export function AppointmentActionsDialog({ isOpen, onOpenChange, appointment }: AppointmentActionsDialogProps) {
  const { updateAppointmentStatus, deleteAppointment, fetchScheduleData } = useSchedule();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [view, setView] = React.useState<'actions' | 'evolution' | 'edit'>('actions');
  const [evolutionState, evolutionFormAction] = useFormState(completeAppointmentWithEvolutionAction, evolutionInitialState);
  const [editState, editFormAction] = useFormState(updateAppointmentAction, evolutionInitialState);
  
  const evolutionFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  
  // State for the edit form
  const { users, loading: usersLoading } = useUser();
  const { units, loading: unitsLoading } = useUnit();
  const [serviceId, setServiceId] = React.useState('');
  const [professionalName, setProfessionalName] = React.useState('');

  // Reset view when appointment changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setView('actions');
      if (appointment) {
        setServiceId(appointment.serviceId);
        setProfessionalName(appointment.professionalName);
      }
      if (evolutionFormRef.current) evolutionFormRef.current.reset();
      if (editFormRef.current) editFormRef.current.reset();
    }
  }, [isOpen, appointment]);

  // Handle successful form submissions
  useEffect(() => {
    if (evolutionState.success) {
      toast({ title: 'Sucesso!', description: evolutionState.message });
      onOpenChange(false);
    } else if (evolutionState.message && !evolutionState.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: evolutionState.message });
    }
  }, [evolutionState, onOpenChange, toast]);

  useEffect(() => {
    if (editState.success) {
      toast({ title: 'Sucesso!', description: editState.message });
      onOpenChange(false);
    } else if (editState.message && !editState.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: editState.message });
    }
  }, [editState, onOpenChange, toast]);


  const handleUpdateStatus = async (status: 'Agendado' | 'Faltou' | 'Cancelado') => {
    if (!appointment) return;
    await updateAppointmentStatus(appointment.id, status);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!appointment) return;
    await deleteAppointment(appointment.id);
    onOpenChange(false);
  };

  // Memoized data for the edit form
  const selectedUnit = useMemo(() => units.find(u => u.id === appointment?.unitId), [units, appointment]);
  const availableServices = selectedUnit?.services || [];
  const selectedService = useMemo(() => availableServices.find(s => s.id === serviceId), [availableServices, serviceId]);
  const availableProfessionals = useMemo(() => {
    if (!selectedService) return [];
    return users.filter(user => selectedService.professionalIds.includes(user.id));
  }, [users, selectedService]);
  const availableRooms = selectedUnit?.rooms || [];

  React.useEffect(() => {
    // When the selected service changes, check if the currently selected professional is valid.
    // If not, reset it. This prevents submitting an invalid combination.
    if (serviceId && availableProfessionals.length > 0) {
      const isProfessionalValid = availableProfessionals.some(p => p.name === professionalName);
      if (!isProfessionalValid) {
        setProfessionalName('');
      }
    }
  }, [serviceId, availableProfessionals, professionalName]);


  if (!appointment) return null;
  
  const isLoading = usersLoading || unitsLoading;
  const canEditProfessional = currentUser?.role === 'Admin' || currentUser?.role === 'Coordinator' || currentUser?.role === 'Receptionist';
  const isFinalized = appointment.status !== 'Agendado';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {view === 'actions' && (
          <>
            <DialogHeader>
              <DialogTitle>Ações do Agendamento</DialogTitle>
              <DialogDescription>
                 {isFinalized
                  ? 'Este agendamento já foi finalizado. Você pode editar os detalhes ou reverter o status.'
                  : 'Gerencie o status ou remova este agendamento.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{appointment.patientName}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{appointment.healthPlanName || 'Particular'}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Stethoscope className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{appointment.serviceName}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(appointment.date + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{appointment.time} - {appointment.endTime}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span>Sala {appointment.room}</span>
                    </div>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-medium">Alterar Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setView('evolution')} disabled={isFinalized}>
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Atendimento Realizado
                        </Button>
                        <Button variant="outline" onClick={() => handleUpdateStatus('Faltou')} disabled={isFinalized}>
                             <XCircle className="mr-2 h-4 w-4 text-destructive" />
                            Faltou
                        </Button>
                    </div>
                    {isFinalized && (
                        <Button variant="outline" className="w-full mt-2" onClick={() => handleUpdateStatus('Agendado')}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reverter para "Agendado"
                        </Button>
                    )}
                 </div>
                 <div className="pt-2">
                    <h4 className="font-medium">Outras Ações</h4>
                    <Button variant="outline" className="w-full justify-start mt-2" onClick={() => setView('edit')}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Agendamento
                    </Button>
                </div>
            </div>
            <DialogFooter className="justify-between sm:justify-between w-full">
                <div className="flex gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Registro
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação removerá permanentemente o agendamento do sistema. Deseja continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Não</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Sim, excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleUpdateStatus('Cancelado')} disabled={isFinalized}>
                        <CircleAlert className="mr-2 h-4 w-4" />
                        Cancelar Agendamento
                    </Button>
                </div>
                 <DialogClose asChild>
                    <Button type="button" variant="ghost">Fechar</Button>
                </DialogClose>
            </DialogFooter>
          </>
        )}

        {view === 'evolution' && (
          <form ref={evolutionFormRef} action={evolutionFormAction}>
            <DialogHeader>
              <DialogTitle>Registrar Evolução</DialogTitle>
              <DialogDescription>
                O atendimento foi concluído. Registre a evolução do paciente para finalizar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {evolutionState.message && !evolutionState.success && !evolutionState.errors && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <CircleAlert className="h-4 w-4" />
                      <p>{evolutionState.message}</p>
                  </div>
              )}
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <input type="hidden" name="patientId" value={appointment.patientId} />
              <input type="hidden" name="author" value={currentUser?.name || 'Sistema'} />
              <div className="space-y-2">
                <Label htmlFor="title">Título do Registro</Label>
                <Input id="title" name="title" required />
                {evolutionState.errors?.title && <p className="text-xs text-destructive mt-1">{evolutionState.errors.title[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Detalhes da Evolução</Label>
                <Textarea id="details" name="details" required rows={8} />
                {evolutionState.errors?.details && <p className="text-xs text-destructive mt-1">{evolutionState.errors.details[0]}</p>}
              </div>
            </div>
            <DialogFooter className="justify-between">
                <Button type="button" variant="outline" onClick={() => setView('actions')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <EvolutionSubmitButton />
            </DialogFooter>
          </form>
        )}
        
        {view === 'edit' && (
            <form ref={editFormRef} action={editFormAction}>
              <DialogHeader>
                <DialogTitle>Editar Agendamento</DialogTitle>
                <DialogDescription>Ajuste os detalhes do agendamento para {appointment.patientName}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {editState.message && !editState.success && !editState.errors && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <CircleAlert className="h-4 w-4" />
                        <p>{editState.message}</p>
                    </div>
                )}
                <input type="hidden" name="appointmentId" value={appointment.id} />
                
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Input value={appointment.patientName} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service">Serviço</Label>
                  <Select name="serviceId" onValueChange={setServiceId} defaultValue={appointment.serviceId} required disabled={isLoading}>
                    <SelectTrigger id="service"><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                    <SelectContent>
                      {availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {editState.errors?.serviceId && <p className="text-xs text-destructive mt-1">{editState.errors.serviceId[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional">Profissional</Label>
                  <Select name="professionalName" onValueChange={setProfessionalName} value={professionalName} required disabled={isLoading || !canEditProfessional || availableProfessionals.length === 0}>
                    <SelectTrigger id="professional"><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                    <SelectContent>
                        {availableProfessionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {editState.errors?.professionalName && <p className="text-xs text-destructive mt-1">{editState.errors.professionalName[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input id="date" name="date" type="date" defaultValue={appointment.date} required disabled={isLoading}/>
                        {editState.errors?.date && <p className="text-xs text-destructive mt-1">{editState.errors.date[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="time">Horário</Label>
                        <div className="flex items-center gap-2">
                            <Input id="time" name="time" type="time" defaultValue={appointment.time} required disabled={isLoading}/>
                            <Input id="endTime" name="endTime" type="time" defaultValue={appointment.endTime} required disabled={isLoading}/>
                        </div>
                        {editState.errors?.endTime && <p className="text-xs text-destructive mt-1">{editState.errors.endTime[0]}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Sala</Label>
                  <Select name="room" defaultValue={appointment.room} required disabled={isLoading || availableRooms.length === 0}>
                    <SelectTrigger id="room"><SelectValue placeholder="Selecione uma sala" /></SelectTrigger>
                    <SelectContent>
                      {availableRooms.sort().map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {editState.errors?.room && <p className="text-xs text-destructive mt-1">{editState.errors.room[0]}</p>}
                </div>

              </div>
              <DialogFooter className="justify-between">
                <Button type="button" variant="outline" onClick={() => setView('actions')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <EditSubmitButton />
              </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

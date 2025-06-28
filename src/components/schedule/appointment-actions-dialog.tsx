'use client';

import * as React from 'react';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

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
import { Calendar, Clock, User, Home, CheckCircle, XCircle, AlertCircle, Trash2, Stethoscope, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { completeAppointmentWithEvolutionAction } from '@/lib/actions';

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
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar e Concluir Atendimento
    </Button>
  );
}


export function AppointmentActionsDialog({ isOpen, onOpenChange, appointment }: AppointmentActionsDialogProps) {
  const { updateAppointmentStatus, deleteAppointment } = useSchedule();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [view, setView] = React.useState<'actions' | 'evolution'>('actions');
  const [evolutionState, evolutionFormAction] = useActionState(completeAppointmentWithEvolutionAction, evolutionInitialState);
  const evolutionFormRef = useRef<HTMLFormElement>(null);

  // Reset view when appointment changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setView('actions');
      // Reset form state if it was previously in error
      if (evolutionFormRef.current) {
        evolutionFormRef.current.reset();
      }
    }
  }, [isOpen, appointment]);

  // Handle successful form submission
  useEffect(() => {
    if (evolutionState.success) {
      toast({ title: 'Sucesso!', description: evolutionState.message });
      onOpenChange(false);
    } else if (evolutionState.message && !evolutionState.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: evolutionState.message });
    }
  }, [evolutionState, onOpenChange, toast]);

  const handleUpdateStatus = async (status: 'Faltou' | 'Cancelado') => {
    if (!appointment) return;
    await updateAppointmentStatus(appointment.id, status);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!appointment) return;
    await deleteAppointment(appointment.id);
    onOpenChange(false);
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {view === 'actions' && (
          <>
            <DialogHeader>
              <DialogTitle>Ações do Agendamento</DialogTitle>
              <DialogDescription>
                Gerencie o status ou remova este agendamento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{appointment.patientName}</span>
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
                        <Button variant="outline" onClick={() => setView('evolution')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                            Atendimento Realizado
                        </Button>
                        <Button variant="outline" onClick={() => handleUpdateStatus('Faltou')}>
                             <XCircle className="mr-2 h-4 w-4 text-destructive" />
                            Faltou
                        </Button>
                    </div>
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
                    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleUpdateStatus('Cancelado')}>
                        <AlertCircle className="mr-2 h-4 w-4" />
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
                      <AlertCircle className="h-4 w-4" />
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
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
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
import { Calendar, Clock, User, Home, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface AppointmentActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment: Appointment | null;
}

export function AppointmentActionsDialog({ isOpen, onOpenChange, appointment }: AppointmentActionsDialogProps) {
  const { updateAppointmentStatus, deleteAppointment } = useSchedule();
  const { toast } = useToast();
  
  const handleUpdateStatus = async (status: 'Realizado' | 'Faltou' | 'Cancelado') => {
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
      <DialogContent>
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
                    <Button variant="outline" onClick={() => handleUpdateStatus('Realizado')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Realizado
                    </Button>
                    <Button variant="outline" onClick={() => handleUpdateStatus('Faltou')}>
                         <XCircle className="mr-2 h-4 w-4 text-red-500" />
                        Faltou
                    </Button>
                </div>
             </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between w-full">
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive-outline">
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
                <Button variant="destructive" onClick={() => handleUpdateStatus('Cancelado')}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Cancelar Agendamento
                </Button>
            </div>
             <DialogClose asChild>
                <Button type="button" variant="ghost">Fechar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

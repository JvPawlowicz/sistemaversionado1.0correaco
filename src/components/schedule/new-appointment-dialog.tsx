'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatient } from '@/contexts/PatientContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Loader2 } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewAppointmentDialog({ isOpen, onOpenChange }: NewAppointmentDialogProps) {
  const { patients, loading: patientsLoading } = usePatient();
  const { users, loading: usersLoading } = useUser();
  const { addAppointment } = useSchedule();
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const [patientId, setPatientId] = React.useState('');
  const [professionalName, setProfessionalName] = React.useState('');
  const [discipline, setDiscipline] = React.useState('');
  const [date, setDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('10:00');
  const [room, setRoom] = React.useState('');
  
  const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPatient = patients.find(p => p.id === patientId);
    if (!selectedPatient || !professionalName || !discipline || !date || !time || !endTime || !room) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos do formulário.",
        });
        return;
    }
    
    setIsSaving(true);
    
    const newAppointmentData: Omit<Appointment, 'id' | 'createdAt' | 'color'> = {
        patientId,
        patientName: selectedPatient.name,
        professionalName,
        discipline,
        date,
        time,
        endTime,
        room
    };

    await addAppointment(newAppointmentData);
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para criar um novo agendamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient" className="text-right">Paciente</Label>
              <Select onValueChange={setPatientId} value={patientId} required>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione um paciente" />
                 </SelectTrigger>
                 <SelectContent>
                   {patientsLoading ? (
                     <SelectItem value="loading" disabled>Carregando...</SelectItem>
                   ) : (
                     patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                   )}
                 </SelectContent>
               </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="professional" className="text-right">Profissional</Label>
              <Select onValueChange={setProfessionalName} value={professionalName} required>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione um profissional" />
                 </SelectTrigger>
                 <SelectContent>
                    {usersLoading ? (
                     <SelectItem value="loading" disabled>Carregando...</SelectItem>
                   ) : (
                     professionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)
                   )}
                 </SelectContent>
               </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discipline" className="text-right">Disciplina</Label>
               <Input id="discipline" value={discipline} onChange={e => setDiscipline(e.target.value)} className="col-span-3" required placeholder="Ex: Fisioterapia"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Data</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Horário</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                 <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
                 <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Sala</Label>
              <Input id="room" value={room} onChange={e => setRoom(e.target.value)} className="col-span-3" required placeholder="Ex: Sala 1"/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || patientsLoading || usersLoading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

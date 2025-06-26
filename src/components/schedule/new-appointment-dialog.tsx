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
import { useSchedule } from '@/contexts/ScheduleContext';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { usePatient } from '@/contexts/PatientContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewAppointmentDialog({ isOpen, onOpenChange }: NewAppointmentDialogProps) {
  const [mounted, setMounted] = React.useState(false);
  const { users, loading: usersLoading } = useUser();
  const { patients, loading: patientsLoading } = usePatient();
  const { units, selectedUnitId, loading: unitsLoading } = useUnit();
  const { addAppointment } = useSchedule();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const [patientId, setPatientId] = React.useState('');
  const [patientName, setPatientName] = React.useState('');
  const [professionalName, setProfessionalName] = React.useState('');
  const [discipline, setDiscipline] = React.useState('');
  const [date, setDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('10:00');
  const [room, setRoom] = React.useState('');
  const [repeat, setRepeat] = React.useState(false);

  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = React.useState(false);
  
  const professionals = users.filter(u => 
    (u.role === 'Therapist' || u.role === 'Admin' || u.role === 'Coordinator') &&
    selectedUnitId &&
    u.unitIds.includes(selectedUnitId)
  );
  
  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const availableRooms = selectedUnit ? selectedUnit.rooms : [];

  const resetForm = () => {
    setPatientId('');
    setPatientName('');
    setProfessionalName(currentUser?.role === 'Therapist' ? currentUser.name : '');
    setDiscipline('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
    setEndTime('10:00');
    setRoom('');
    setRepeat(false);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (currentUser?.role === 'Therapist') {
      setProfessionalName(currentUser.name);
    }
  }, [currentUser]);


  React.useEffect(() => {
    // Reset room selection when unit changes
    setRoom('');
  }, [selectedUnitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !professionalName || !discipline || !date || !time || !endTime || !room || !selectedUnitId) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos do formulário.",
        });
        return;
    }
    
    setIsSaving(true);
    
    const newAppointmentData: Omit<Appointment, 'id' | 'createdAt' | 'color' | 'status'> = {
        patientId,
        patientName,
        professionalName,
        discipline,
        date,
        time,
        endTime,
        room,
        unitId: selectedUnitId,
    };

    await addAppointment({ appointment: newAppointmentData, repeat });
    setIsSaving(false);
    onOpenChange(false);
    resetForm();
  };

  if (!mounted) {
    return null;
  }
  
  const isLoading = usersLoading || unitsLoading || patientsLoading;
  const isTherapist = currentUser?.role === 'Therapist';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
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
              <div className="col-span-3">
                 <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPatientPopoverOpen}
                      className="w-full justify-between"
                      disabled={isLoading}
                    >
                      {patientName || "Selecione um paciente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar paciente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.name}
                              onSelect={() => {
                                setPatientId(patient.id);
                                setPatientName(patient.name);
                                setIsPatientPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  patientId === patient.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {patient.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="professional" className="text-right">Profissional</Label>
              <Select onValueChange={setProfessionalName} value={professionalName} required disabled={isLoading || isTherapist}>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione um profissional" />
                 </SelectTrigger>
                 <SelectContent>
                    {isLoading ? (
                     <SelectItem value="loading" disabled>Carregando...</SelectItem>
                   ) : (
                     professionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)
                   )}
                 </SelectContent>
               </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discipline" className="text-right">Disciplina</Label>
               <Input id="discipline" value={discipline} onChange={e => setDiscipline(e.target.value)} className="col-span-3" required placeholder="Ex: Fisioterapia" disabled={isLoading}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Data</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-3" required disabled={isLoading}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Horário</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                 <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required disabled={isLoading}/>
                 <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required disabled={isLoading}/>
              </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Sala</Label>
              <Select onValueChange={setRoom} value={room} required disabled={!selectedUnitId || availableRooms.length === 0 || isLoading}>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione uma sala" />
                 </SelectTrigger>
                 <SelectContent>
                   {availableRooms.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="repeat" className="text-right">Repetir</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="repeat"
                  checked={repeat}
                  onCheckedChange={setRepeat}
                  disabled={isLoading}
                />
                <Label htmlFor="repeat" className="text-sm text-muted-foreground">
                  Repetir semanalmente por 4 semanas
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

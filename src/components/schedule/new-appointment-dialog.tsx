
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
import type { Appointment, Service, User } from '@/lib/types';
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
  const { users, loading: usersLoading } = useUser();
  const { patients, loading: patientsLoading } = usePatient();
  const { units, selectedUnitId, loading: unitsLoading } = useUnit();
  const { addAppointment } = useSchedule();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const [patientId, setPatientId] = React.useState('');
  const [serviceId, setServiceId] = React.useState('');
  const [professionalName, setProfessionalName] = React.useState('');
  const [date, setDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('10:00');
  const [room, setRoom] = React.useState('Sala 1'); // Simplified room
  const [repeat, setRepeat] = React.useState(false);

  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = React.useState(false);
  
  const selectedUnit = React.useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);
  const availableServices = selectedUnit?.services || [];
  
  const selectedService = React.useMemo(() => availableServices.find(s => s.id === serviceId), [availableServices, serviceId]);
  
  const availableProfessionals = React.useMemo(() => {
    if (!selectedService) return [];
    return users.filter(user => selectedService.professionalIds.includes(user.id));
  }, [users, selectedService]);

  const resetForm = () => {
    setPatientId('');
    setServiceId('');
    setProfessionalName(currentUser?.role === 'Therapist' ? currentUser.name : '');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
    setEndTime('10:00');
    setRoom('Sala 1');
    setRepeat(false);
  };
  
  React.useEffect(() => {
    setServiceId('');
    setProfessionalName('');
  }, [selectedUnitId]);

  React.useEffect(() => {
    setProfessionalName('');
  }, [serviceId]);

  React.useEffect(() => {
    if (currentUser?.role === 'Therapist') {
      // Find a service this therapist is in for the selected unit
      const service = availableServices.find(s => s.professionalIds.includes(currentUser.id));
      if (service) {
        setServiceId(service.id);
        setProfessionalName(currentUser.name);
      }
    }
  }, [currentUser, availableServices]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientName = patients.find(p => p.id === patientId)?.name;
    const serviceName = selectedService?.name;

    if (!patientId || !professionalName || !serviceId || !date || !time || !endTime || !room || !selectedUnitId || !patientName || !serviceName) {
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
        serviceId,
        serviceName,
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

  const isLoading = usersLoading || unitsLoading || patientsLoading;
  const canEditProfessional = currentUser?.role === 'Admin' || currentUser?.role === 'Coordinator' || currentUser?.role === 'Receptionist';

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
              Preencha os detalhes para criar um novo agendamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient" className="text-right">Paciente</Label>
              <div className="col-span-3">
                 <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between" disabled={isLoading}>
                      {patientId ? patients.find(p => p.id === patientId)?.name : "Selecione um paciente..."}
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
                            <CommandItem key={patient.id} value={patient.name} onSelect={() => { setPatientId(patient.id); setIsPatientPopoverOpen(false); }}>
                              <Check className={cn('mr-2 h-4 w-4', patientId === patient.id ? 'opacity-100' : 'opacity-0')} />
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
              <Label htmlFor="service" className="text-right">Serviço</Label>
              <Select onValueChange={setServiceId} value={serviceId} required disabled={isLoading || availableServices.length === 0}>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione um serviço" />
                 </SelectTrigger>
                 <SelectContent>
                   {availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="professional" className="text-right">Profissional</Label>
              <Select onValueChange={setProfessionalName} value={professionalName} required disabled={isLoading || !canEditProfessional || availableProfessionals.length === 0}>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione um profissional" />
                 </SelectTrigger>
                 <SelectContent>
                    {availableProfessionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                 </SelectContent>
               </Select>
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
              <Label htmlFor="repeat" className="text-right">Repetir</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch id="repeat" checked={repeat} onCheckedChange={setRepeat} disabled={isLoading} />
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


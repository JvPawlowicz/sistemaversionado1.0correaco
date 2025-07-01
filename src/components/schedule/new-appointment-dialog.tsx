
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
import { useSchedule, type AddAppointmentData } from '@/contexts/ScheduleContext';
import { Loader2, ChevronsUpDown, Check, User as UserIcon, Users as UsersIcon } from 'lucide-react';
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
import { useTherapyGroup } from '@/contexts/TherapyGroupContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface NewAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewAppointmentDialog({ isOpen, onOpenChange }: NewAppointmentDialogProps) {
  const { users, loading: usersLoading } = useUser();
  const { patients, loading: patientsLoading } = usePatient();
  const { units, selectedUnitId, loading: unitsLoading } = useUnit();
  const { therapyGroups, loading: groupsLoading } = useTherapyGroup();
  const { addAppointment } = useSchedule();
  const { currentUser } = useAuth();
  
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const [scheduleType, setScheduleType] = React.useState<'individual' | 'group'>('individual');
  const [patientId, setPatientId] = React.useState('');
  const [groupId, setGroupId] = React.useState('');
  const [serviceId, setServiceId] = React.useState('');
  const [professionalName, setProfessionalName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('10:00');
  const [room, setRoom] = React.useState('');
  const [repeat, setRepeat] = React.useState(false);

  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = React.useState(false);
  
  const selectedUnit = React.useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);
  const availableServices = selectedUnit?.services || [];
  const availableRooms = selectedUnit?.rooms || [];
  
  const selectedGroup = React.useMemo(() => therapyGroups.find(g => g.id === groupId), [therapyGroups, groupId]);
  
  const selectedService = React.useMemo(() => {
    if (scheduleType === 'group' && selectedGroup) {
      return availableServices.find(s => s.id === selectedGroup.serviceId);
    }
    return availableServices.find(s => s.id === serviceId);
  }, [availableServices, serviceId, selectedGroup, scheduleType]);
  
  const availableProfessionals = React.useMemo(() => {
    if (!selectedService) return [];
    return users.filter(user => selectedService.professionalIds.includes(user.id));
  }, [users, selectedService]);

  React.useEffect(() => {
    if (isOpen) {
      // Set date only when dialog opens to avoid hydration issues
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen]);

  const resetForm = () => {
    setScheduleType('individual');
    setPatientId('');
    setGroupId('');
    setServiceId('');
    setProfessionalName(currentUser?.role === 'Therapist' ? currentUser.name : '');
    setDate('');
    setTime('09:00');
    setEndTime('10:00');
    setRoom('');
    setRepeat(false);
  };
  
  React.useEffect(() => {
    setServiceId('');
    setProfessionalName('');
    setGroupId('');
    setRoom('');
  }, [selectedUnitId]);

  React.useEffect(() => {
    setProfessionalName('');
  }, [serviceId]);

  React.useEffect(() => {
    if (scheduleType === 'group' && selectedGroup) {
      setServiceId(selectedGroup.serviceId);
      // Maybe auto-select a professional if only one is available
      if(selectedGroup.professionalIds.length === 1) {
        const prof = users.find(u => u.id === selectedGroup.professionalIds[0]);
        if(prof) setProfessionalName(prof.name);
      }
    }
  }, [scheduleType, selectedGroup, users]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    let isDataValid = false;
    let data: AddAppointmentData | null = null;
    const serviceName = selectedService?.name;
    
    if (!professionalName || !serviceName || !date || !time || !endTime || !room || !selectedUnitId) {
        toast({ variant: "destructive", title: "Campos incompletos", description: "Todos os campos devem ser preenchidos para criar um agendamento." });
        setIsSaving(false);
        return;
    }

    const baseAppointment = { professionalName, serviceId, serviceName, date, time, endTime, room, unitId: selectedUnitId, groupId: groupId || undefined };

    if (scheduleType === 'individual' && patientId) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        data = { baseAppointment, patientId, patientNames: { [patientId]: patient.name }, isGroup: false, repeat };
        isDataValid = true;
      }
    } else if (scheduleType === 'group' && selectedGroup) {
        const groupPatientIds = selectedGroup.patientIds;
        const groupPatientNames = groupPatientIds.reduce((acc, id) => {
            const patient = patients.find(p => p.id === id);
            if(patient) acc[id] = patient.name;
            return acc;
        }, {} as {[id:string]: string});

        data = { baseAppointment: {...baseAppointment, groupId: selectedGroup.id}, patientIds: groupPatientIds, patientNames: groupPatientNames, isGroup: true, repeat };
        isDataValid = true;
    }


    if (!isDataValid || !data) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Por favor, selecione um paciente ou grupo válido." });
      setIsSaving(false);
      return;
    }
    
    await addAppointment(data);
    setIsSaving(false);
    onOpenChange(false);
    resetForm();
  };

  const isLoading = usersLoading || unitsLoading || patientsLoading || groupsLoading;
  const canEditProfessional = currentUser?.role === 'Admin' || currentUser?.role === 'Coordinator' || currentUser?.role === 'Receptionist';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>Preencha os detalhes para criar um novo agendamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <RadioGroup defaultValue="individual" value={scheduleType} onValueChange={(v) => setScheduleType(v as any)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="individual" id="r-individual" className="peer sr-only" />
                  <Label htmlFor="r-individual" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <UserIcon className="mb-3 h-6 w-6" />
                    Individual
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="group" id="r-group" className="peer sr-only" />
                  <Label htmlFor="r-group" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <UsersIcon className="mb-3 h-6 w-6" />
                    Em Grupo
                  </Label>
                </div>
            </RadioGroup>

            {scheduleType === 'individual' ? (
                <div className="space-y-2">
                    <Label htmlFor="patient">Paciente</Label>
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
            ) : (
                 <div className="space-y-2">
                    <Label htmlFor="group">Grupo</Label>
                    <Select onValueChange={setGroupId} value={groupId} required disabled={isLoading || therapyGroups.length === 0}>
                        <SelectTrigger id="group"><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                        <SelectContent>
                            {therapyGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

             <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select onValueChange={setServiceId} value={serviceId} required disabled={isLoading || availableServices.length === 0 || scheduleType === 'group'}>
                 <SelectTrigger id="service"><SelectValue placeholder={availableServices.length === 0 ? "Nenhum serviço disponível" : "Selecione um serviço"} /></SelectTrigger>
                 <SelectContent>
                   {availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="professional">Profissional</Label>
              <Select onValueChange={setProfessionalName} value={professionalName} required disabled={isLoading || !canEditProfessional || availableProfessionals.length === 0}>
                 <SelectTrigger id="professional"><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                 <SelectContent>
                    {availableProfessionals.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={isLoading}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <div className="flex items-center gap-2">
                        <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required disabled={isLoading}/>
                        <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required disabled={isLoading}/>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Sala</Label>
              <Select onValueChange={setRoom} value={room} required disabled={isLoading || availableRooms.length === 0}>
                 <SelectTrigger id="room"><SelectValue placeholder="Selecione uma sala" /></SelectTrigger>
                 <SelectContent>
                   {availableRooms.sort().map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="repeat" checked={repeat} onCheckedChange={setRepeat} disabled={isLoading} />
              <Label htmlFor="repeat" className="text-sm text-muted-foreground">Repetir semanalmente por 4 semanas</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
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

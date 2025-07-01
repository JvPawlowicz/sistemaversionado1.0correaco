'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronsUpDown, Check, CircleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from '@/contexts/UnitContext';
import { useUser } from '@/contexts/UserContext';
import { usePatient } from '@/contexts/PatientContext';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createTherapyGroupAction } from '@/lib/actions/group';
import { useTherapyGroup } from '@/contexts/TherapyGroupContext';

const initialState = { success: false, message: '', errors: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Grupo
    </Button>
  );
}

export function NewTherapyGroupDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; }) {
  const [state, formAction] = useActionState(createTherapyGroupAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const { units, selectedUnitId } = useUnit();
  const { users, loading: usersLoading } = useUser();
  const { patients, loading: patientsLoading } = usePatient();
  const { fetchTherapyGroups } = useTherapyGroup();

  const [serviceId, setServiceId] = useState('');
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  
  const [isProfPopoverOpen, setIsProfPopoverOpen] = useState(false);
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = useState(false);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);
  const availableServices = selectedUnit?.services || [];
  const selectedService = useMemo(() => availableServices.find(s => s.id === serviceId), [availableServices, serviceId]);
  
  const availableProfessionals = useMemo(() => {
    if (!selectedService) return [];
    return users.filter(user => selectedService.professionalIds.includes(user.id));
  }, [users, selectedService]);

  const resetForm = () => {
    formRef.current?.reset();
    setServiceId('');
    setSelectedProfessionalIds([]);
    setSelectedPatientIds([]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchTherapyGroups();
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onOpenChange, fetchTherapyGroups]);
  
  const selectedProfessionals = users.filter(user => selectedProfessionalIds.includes(user.id));
  const selectedPatients = patients.filter(patient => selectedPatientIds.includes(patient.id));
  const isLoading = usersLoading || patientsLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form ref={formRef} action={formAction}>
           <DialogHeader>
            <DialogTitle>Novo Grupo de Terapia</DialogTitle>
            <DialogDescription>
              Crie um novo grupo, vincule um serviço e adicione os participantes e profissionais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="unitId" value={selectedUnitId || ''} />
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input id="name" name="name" required />
              {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select name="serviceId" onValueChange={setServiceId} value={serviceId} required>
                 <SelectTrigger id="service"><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                 <SelectContent>
                   {availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                 </SelectContent>
               </Select>
               {state.errors?.serviceId && <p className="text-xs text-destructive mt-1">{state.errors.serviceId[0]}</p>}
            </div>
            <div className="space-y-2">
               <Label htmlFor="professionals">Profissionais</Label>
                {selectedProfessionalIds.map(id => <input key={id} type="hidden" name="professionalIds" value={id} />)}
                <Popover open={isProfPopoverOpen} onOpenChange={setIsProfPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10" disabled={isLoading || !serviceId}>
                            <div className="flex gap-1 flex-wrap">
                                {selectedProfessionals.length > 0 ? selectedProfessionals.map(u => <Badge variant="secondary" key={u.id}>{u.name}</Badge>) : "Selecione..."}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar profissional..." />
                            <CommandList>
                                <CommandEmpty>Nenhum profissional.</CommandEmpty>
                                <CommandGroup>
                                    {availableProfessionals.map(u => (
                                        <CommandItem key={u.id} value={u.name} onSelect={() => setSelectedProfessionalIds(p => p.includes(u.id) ? p.filter(id => id !== u.id) : [...p, u.id])}>
                                            <Check className={cn('mr-2 h-4 w-4', selectedProfessionalIds.includes(u.id) ? 'opacity-100' : 'opacity-0')} />
                                            {u.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {state.errors?.professionalIds && <p className="text-xs text-destructive mt-1">{state.errors.professionalIds[0]}</p>}
            </div>
            <div className="space-y-2">
               <Label htmlFor="patients">Pacientes</Label>
                {selectedPatientIds.map(id => <input key={id} type="hidden" name="patientIds" value={id} />)}
                <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10" disabled={isLoading}>
                            <div className="flex gap-1 flex-wrap">
                                {selectedPatients.length > 0 ? selectedPatients.map(p => <Badge variant="secondary" key={p.id}>{p.name}</Badge>) : "Selecione..."}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar paciente..." />
                            <CommandList>
                                <CommandEmpty>Nenhum paciente.</CommandEmpty>
                                <CommandGroup>
                                    {patients.map(p => (
                                        <CommandItem key={p.id} value={p.name} onSelect={() => setSelectedPatientIds(s => s.includes(p.id) ? s.filter(id => id !== p.id) : [...s, p.id])}>
                                            <Check className={cn('mr-2 h-4 w-4', selectedPatientIds.includes(p.id) ? 'opacity-100' : 'opacity-0')} />
                                            {p.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                {state.errors?.patientIds && <p className="text-xs text-destructive mt-1">{state.errors.patientIds[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

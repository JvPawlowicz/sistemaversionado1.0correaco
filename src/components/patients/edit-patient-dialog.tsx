
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CircleAlert, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePatientDetailsAction } from '@/lib/actions';
import type { Patient } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useUnit } from '@/contexts/UnitContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface EditPatientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patient: Patient | null;
  onPatientUpdated: () => void;
}

const initialState = {
  success: false,
  message: '',
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Alterações
    </Button>
  );
}

export function EditPatientDialog({ isOpen, onOpenChange, patient, onPatientUpdated }: EditPatientDialogProps) {
  const [state, formAction] = useActionState(updatePatientDetailsAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { units, loading: unitsLoading } = useUnit();

  const [selectedUnitIds, setSelectedUnitIds] = React.useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (patient) {
        setSelectedUnitIds(patient.unitIds || []);
    }
  }, [patient]);

  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      onPatientUpdated();
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onPatientUpdated, onOpenChange]);
  
  const handleClose = () => {
    onOpenChange(false);
  }

  if (!patient) return null;
  
  const displayableUnits = units.filter(u => u.id !== 'central');
  const selectedUnits = displayableUnits.filter(unit => selectedUnitIds.includes(unit.id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Altere as informações do paciente {patient.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="patientId" value={patient.id} />
            
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" name="name" defaultValue={patient.name} required />
                    {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" defaultValue={patient.email || ''} />
                    {state.errors?.email && <p className="text-xs text-destructive mt-1">{state.errors.email[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" defaultValue={patient.phone || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dob">Data de Nascimento</Label>
                    <Input id="dob" name="dob" type="date" defaultValue={patient.dob || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select name="gender" defaultValue={patient.gender || ''}>
                        <SelectTrigger><SelectValue placeholder="Não informado" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="Male">Masculino</SelectItem>
                             <SelectItem value="Female">Feminino</SelectItem>
                             <SelectItem value="Other">Outro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="referringProfessional">Profissional Indicador</Label>
                    <Input id="referringProfessional" name="referringProfessional" defaultValue={patient.referringProfessional || ''} />
                </div>
            </fieldset>

            <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Textarea id="diagnosis" name="diagnosis" defaultValue={patient.diagnosis || ''} rows={3} />
            </div>

            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="addressStreet">Endereço</Label>
                    <Input id="addressStreet" name="addressStreet" placeholder="Rua, Av, etc." defaultValue={patient.address?.street || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="addressCity">Cidade</Label>
                    <Input id="addressCity" name="addressCity" placeholder="Cidade" defaultValue={patient.address?.city || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="addressState">Estado</Label>
                    <Input id="addressState" name="addressState" placeholder="UF" defaultValue={patient.address?.state || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="addressZip">CEP</Label>
                    <Input id="addressZip" name="addressZip" placeholder="00000-000" defaultValue={patient.address?.zip || ''} />
                </div>
            </fieldset>

            <div className="space-y-2">
               <Label htmlFor="units">Unidades Vinculadas</Label>
                {selectedUnitIds.map(id => <input key={id} type="hidden" name="unitIds" value={id} />)}
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10" disabled={unitsLoading}>
                    <div className="flex gap-1 flex-wrap">
                        {selectedUnits.length > 0 ? selectedUnits.map(unit => (
                        <Badge variant="secondary" key={unit.id} className="mr-1">{unit.name}</Badge>
                        )) : "Selecione as unidades..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                    <CommandInput placeholder="Buscar unidade..." />
                    <CommandList>
                        <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                        <CommandGroup>
                        {displayableUnits.map((unit) => (
                            <CommandItem key={unit.id} value={unit.name} onSelect={() => {
                                setSelectedUnitIds(
                                    selectedUnitIds.includes(unit.id)
                                    ? selectedUnitIds.filter((id) => id !== unit.id)
                                    : [...selectedUnitIds, unit.id]
                                );
                                setIsPopoverOpen(true);
                            }}>
                            <Check className={cn('mr-2 h-4 w-4', selectedUnitIds.includes(unit.id) ? 'opacity-100' : 'opacity-0')} />
                            {unit.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
                </Popover>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="imageUseConsent" name="imageUseConsent" defaultChecked={patient.imageUseConsent} />
                <Label htmlFor="imageUseConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    O paciente concede permissão para uso de imagem.
                </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

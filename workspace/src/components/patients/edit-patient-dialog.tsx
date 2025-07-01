'use client';

import { useActionState, useEffect, useRef, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CircleAlert, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePatientDetailsAction } from '@/lib/actions/patient';
import type { Patient, HealthPlan } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useUnit } from '@/contexts/UnitContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  const formRef = useRef<HTMLFormElement>(null);
  const { units, loading: unitsLoading } = useUnit();

  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedHealthPlanId, setSelectedHealthPlanId] = useState<string>('none');

  useEffect(() => {
    if (isOpen && patient) {
      setSelectedUnitIds(patient.unitIds || []);
      setSelectedHealthPlanId(patient.healthPlanId || 'none');
    }
  }, [isOpen, patient]);

  const availableHealthPlans = useMemo(() => {
    const patientUnitPlans = units
      .filter(unit => selectedUnitIds.includes(unit.id) && unit.id !== 'central')
      .flatMap(unit => unit.healthPlans || []);
    const centralUnit = units.find(unit => unit.id === 'central');
    const centralPlans = centralUnit?.healthPlans || [];
    const allAvailablePlans = [...patientUnitPlans, ...centralPlans];
    const uniquePlansMap = new Map<string, HealthPlan>();
    allAvailablePlans.forEach(plan => {
      if (!uniquePlansMap.has(plan.id)) {
        uniquePlansMap.set(plan.id, plan);
      }
    });
    return Array.from(uniquePlansMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedUnitIds, units]);

  useEffect(() => {
    if (selectedHealthPlanId !== 'none' && !availableHealthPlans.some(p => p.id === selectedHealthPlanId)) {
        setSelectedHealthPlanId('none');
    }
  }, [availableHealthPlans, selectedHealthPlanId]);

  useEffect(() => {
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
      <DialogContent className="max-w-3xl">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Altere as informações do paciente {patient.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="patientId" value={patient.id} />
             <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="contact">Contato e Endereço</TabsTrigger>
                <TabsTrigger value="filiation">Filiação</TabsTrigger>
                <TabsTrigger value="clinical">Dados Clínicos</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="pt-4 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" name="name" defaultValue={patient.name} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="dob">Data de Nascimento</Label>
                        <Input id="dob" name="dob" type="date" defaultValue={patient.dob || ''} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" name="cpf" defaultValue={patient.cpf || ''} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input id="rg" name="rg" defaultValue={patient.rg || ''} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor="maritalStatus">Estado Civil</Label>
                        <Input id="maritalStatus" name="maritalStatus" defaultValue={patient.maritalStatus || ''} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="profession">Profissão</Label>
                    <Input id="profession" name="profession" defaultValue={patient.profession || ''} />
                </div>
              </TabsContent>
              <TabsContent value="contact" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" defaultValue={patient.email || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" name="phone" defaultValue={patient.phone || ''} />
                    </div>
                 </div>
                 <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border p-4">
                    <legend className="-ml-1 px-1 text-sm font-medium">Endereço</legend>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressStreet">Logradouro</Label>
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
              </TabsContent>
              <TabsContent value="filiation" className="pt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="motherName">Nome da Mãe</Label>
                    <Input id="motherName" name="motherName" defaultValue={patient.motherName || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fatherName">Nome do Pai</Label>
                    <Input id="fatherName" name="fatherName" defaultValue={patient.fatherName || ''} />
                </div>
              </TabsContent>
              <TabsContent value="clinical" className="pt-4 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cns">CNS (Cartão Nacional de Saúde)</Label>
                        <Input id="cns" name="cns" defaultValue={patient.cns || ''} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="healthPlanId">Plano de Saúde</Label>
                        <Select name="healthPlanId" value={selectedHealthPlanId} onValueChange={setSelectedHealthPlanId} disabled={availableHealthPlans.length === 0}>
                            <SelectTrigger><SelectValue placeholder="Selecione um plano..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {availableHealthPlans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="referringProfessional">Profissional Indicador</Label>
                    <Input id="referringProfessional" name="referringProfessional" defaultValue={patient.referringProfessional || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="diagnosis">Breve Diagnóstico / Queixa Principal</Label>
                    <Textarea id="diagnosis" name="diagnosis" defaultValue={patient.diagnosis || ''} rows={3} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="additionalInfo">Informações Adicionais</Label>
                    <Textarea id="additionalInfo" name="additionalInfo" defaultValue={patient.additionalInfo || ''} rows={3} />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2 pt-4">
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

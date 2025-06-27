'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronsUpDown, Check, CircleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from '@/contexts/UnitContext';
import { useUser } from '@/contexts/UserContext';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createUserAction } from '@/lib/actions';

interface NewUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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
      Salvar Usuário
    </Button>
  );
}

export function NewUserDialog({ isOpen, onOpenChange }: NewUserDialogProps) {
  const [state, formAction] = useActionState(createUserAction, initialState);
  const { toast } = useToast();
  const { units, loading: unitsLoading } = useUnit();
  const { fetchUsers } = useUser();

  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchUsers(); // Instantly refresh the user list
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, onOpenChange, toast, fetchUsers]);
  
  const resetForm = () => {
      formRef.current?.reset();
      setSelectedUnitIds([]);
  };

  const selectedUnits = units.filter(unit => selectedUnitIds.includes(unit.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
             Preencha os detalhes para criar o perfil e o acesso do novo usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <div className="col-span-3">
                <Input id="name" name="name" required />
                {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">E-mail</Label>
              <div className="col-span-3">
                <Input id="email" name="email" type="email" required />
                {state.errors?.email && <p className="text-xs text-destructive mt-1">{state.errors.email[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Senha</Label>
              <div className="col-span-3">
                <Input id="password" name="password" type="password" required />
                {state.errors?.password && <p className="text-xs text-destructive mt-1">{state.errors.password[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Função</Label>
              <div className="col-span-3">
                <Select name="role" defaultValue="Therapist" required>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione uma função" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Therapist">Terapeuta</SelectItem>
                     <SelectItem value="Coordinator">Coordenador</SelectItem>
                     <SelectItem value="Admin">Admin</SelectItem>
                     <SelectItem value="Receptionist">Recepcionista</SelectItem>
                   </SelectContent>
                 </Select>
                 {state.errors?.role && <p className="text-xs text-destructive mt-1">{state.errors.role[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4 pt-2">
               <Label htmlFor="units" className="text-right pt-2">Unidades</Label>
               <div className="col-span-3">
                 {selectedUnitIds.map(id => <input key={id} type="hidden" name="unitIds" value={id} />)}
                 <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPopoverOpen}
                      className="w-full justify-between h-auto min-h-10"
                      disabled={unitsLoading}
                    >
                      <div className="flex gap-1 flex-wrap">
                        {selectedUnits.length > 0 ? selectedUnits.map(unit => (
                          <Badge variant="secondary" key={unit.id} className="mr-1">
                            {unit.name}
                          </Badge>
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
                          {units.map((unit) => (
                            <CommandItem
                              key={unit.id}
                              value={unit.name}
                              onSelect={() => {
                                setSelectedUnitIds(
                                  selectedUnitIds.includes(unit.id)
                                    ? selectedUnitIds.filter((id) => id !== unit.id)
                                    : [...selectedUnitIds, unit.id]
                                );
                                setIsPopoverOpen(true);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', selectedUnitIds.includes(unit.id) ? 'opacity-100' : 'opacity-0')} />
                              {unit.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                 {state.errors?.unitIds && <p className="text-xs text-destructive mt-1">{state.errors.unitIds[0]}</p>}
               </div>
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

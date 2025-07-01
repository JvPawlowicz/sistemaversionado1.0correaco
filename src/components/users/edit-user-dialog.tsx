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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { updateUserAction } from '@/lib/actions/user';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
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

export function EditUserDialog({ isOpen, onOpenChange, user }: EditUserDialogProps) {
  const [state, formAction] = useActionState(updateUserAction, initialState);
  const { toast } = useToast();
  const { units, loading: unitsLoading } = useUnit();
  const { fetchUsers } = useUser();
  const { currentUser, refetchCurrentUser } = useAuth();

  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (user) {
      setSelectedUnitIds(user.unitIds || []);
    }
  }, [user]);

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchUsers();
      if (user && currentUser && user.id === currentUser.id) {
        refetchCurrentUser();
      }
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, onOpenChange, toast, fetchUsers, user, currentUser, refetchCurrentUser]);

  const handleClose = () => {
    formRef.current?.reset();
    setSelectedUnitIds([]);
    onOpenChange(false);
  };
  
  if (!user) return null;

  const selectedUnits = units.filter(unit => selectedUnitIds.includes(unit.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
        else onOpenChange(true);
      }}>
      <DialogContent className="sm:max-w-lg">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações e permissões para <span className="font-semibold">{user.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="uid" value={user.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
              {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required />
              {state.errors?.email && <p className="text-xs text-destructive mt-1">{state.errors.email[0]}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input id="password" name="password" type="password" placeholder="Deixe em branco para não alterar" />
              {state.errors?.password && <p className="text-xs text-destructive mt-1">{state.errors.password[0]}</p>}
            </div>

            <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                    Alterar o e-mail ou a senha desconectará o usuário de todas as sessões ativas.
                </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select name="role" defaultValue={user.role} required>
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

            <div className="space-y-2">
               <Label htmlFor="units">Unidades</Label>
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
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

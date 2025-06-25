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
import { useUser } from '@/contexts/UserContext';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, Unit } from '@/lib/types';
import { useUnit } from '@/contexts/UnitContext';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface NewUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewUserDialog({ isOpen, onOpenChange }: NewUserDialogProps) {
  const [mounted, setMounted] = React.useState(false);
  const { addUser } = useUser();
  const { units, loading: unitsLoading } = useUnit();
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'Admin' | 'Therapist' | 'Receptionist'>('Therapist');
  const [selectedUnitIds, setSelectedUnitIds] = React.useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('Therapist');
    setSelectedUnitIds([]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role || selectedUnitIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos e selecione pelo menos uma unidade.",
      });
      return;
    }
    
    setIsSaving(true);
    
    const newUserData: Omit<User, 'id' | 'status' | 'avatarUrl' | 'createdAt'> = {
      name,
      email,
      role,
      unitIds: selectedUnitIds,
    };

    await addUser(newUserData);
    setIsSaving(false);
    onOpenChange(false);
    resetForm();
  };
  
  const selectedUnits = units.filter(unit => selectedUnitIds.includes(unit.id));

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        onOpenChange(open);
      }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo usuário. <strong>Importante:</strong> Após salvar, crie a conta de login para este usuário (com o mesmo e-mail) na seção de Autenticação do console do Firebase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Função</Label>
              <Select onValueChange={(value) => setRole(value as any)} value={role} required>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione uma função" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Therapist">Terapeuta</SelectItem>
                   <SelectItem value="Admin">Admin</SelectItem>
                   <SelectItem value="Receptionist">Recepcionista</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4 pt-2">
               <Label htmlFor="units" className="text-right pt-2">Unidades</Label>
               <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className="col-span-3 justify-between h-auto min-h-10"
                    disabled={unitsLoading}
                  >
                    <div className="flex gap-1 flex-wrap">
                      {selectedUnits.length > 0 ? selectedUnits.map(unit => (
                        <Badge
                          variant="secondary"
                          key={unit.id}
                          className="mr-1"
                        >
                          {unit.name}
                        </Badge>
                      )) : "Selecione as unidades..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
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
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedUnitIds.includes(unit.id) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {unit.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || unitsLoading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

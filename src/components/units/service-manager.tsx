
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import type { Service, Unit, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnit } from '@/contexts/UnitContext';


interface ServiceManagerProps {
  unit: Unit;
  onServiceChange: (unitId: string, service: Omit<Service, 'id' | 'unitId'>) => Promise<void>;
}

export function ServiceManager({ unit, onServiceChange }: ServiceManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const { users, loading: usersLoading } = useUser();
  const { deleteService } = useUnit();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [capacity, setCapacity] = React.useState(1);
  const [professionalIds, setProfessionalIds] = React.useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  
  // Filter professionals that belong to the current unit
  const professionalsInUnit = users.filter(user => Array.isArray(user.unitIds) && user.unitIds.includes(unit.id) && (user.role === 'Therapist' || user.role === 'Coordinator'));
  const selectedProfessionals = users.filter(user => professionalIds.includes(user.id));

  const resetForm = () => {
    setName('');
    setDescription('');
    setCapacity(1);
    setProfessionalIds([]);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        toast({ variant: 'destructive', title: 'Erro', description: 'O nome do serviço é obrigatório.' });
        return;
    }
    setIsSaving(true);
    await onServiceChange(unit.id, { name, description, capacity, professionalIds });
    setIsSaving(false);
    setIsAddDialogOpen(false);
    resetForm();
  }
  
  const handleDeleteService = async (serviceId: string) => {
    await deleteService(unit.id, serviceId);
  }

  return (
    <div className="space-y-4">
       <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsAddDialogOpen(open);
      }}>
        <DialogContent>
           <form onSubmit={handleSave}>
            <DialogHeader>
                <DialogTitle>Novo Serviço</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo serviço para esta unidade.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Serviço</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidade por Sessão</Label>
                    <Input id="capacity" type="number" min="0" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
                    <p className="text-xs text-muted-foreground">Use 1 para individual, 0 para ilimitado.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="professionals">Profissionais</Label>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10" disabled={usersLoading}>
                        <div className="flex gap-1 flex-wrap">
                            {selectedProfessionals.length > 0 ? selectedProfessionals.map(user => (
                            <Badge variant="secondary" key={user.id} className="mr-1">{user.name}</Badge>
                            )) : "Selecione profissionais..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput placeholder="Buscar profissional..." />
                        <CommandList>
                            <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
                            <CommandGroup>
                            {professionalsInUnit.map((user) => (
                                <CommandItem key={user.id} value={user.name} onSelect={() => {
                                    setProfessionalIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]);
                                    setIsPopoverOpen(true);
                                }}>
                                <Check className={cn('mr-2 h-4 w-4', professionalIds.includes(user.id) ? 'opacity-100' : 'opacity-0')} />
                                {user.name}
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
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Serviço
                </Button>
            </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>
        <div className="flex justify-end">
            <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Serviço
            </Button>
        </div>
        {unit.services && unit.services.length > 0 ? (
            <div className="space-y-3">
            {unit.services.map((service) => (
                <Card key={service.id} className="bg-secondary/50">
                <CardHeader className="p-4 flex flex-row items-start justify-between">
                    <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>Capacidade: {service.capacity === 0 ? "Ilimitada" : service.capacity}</CardDescription>
                    </div>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover o serviço {service.name}?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Não</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 text-sm">
                    <p className="text-muted-foreground">{service.description || 'Nenhuma descrição.'}</p>
                     <div>
                        <strong className="text-muted-foreground">Profissionais:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                             {service.professionalIds.length > 0 ? service.professionalIds.map(id => {
                                const prof = users.find(u => u.id === id);
                                return prof ? <Badge key={id} variant="outline">{prof.name}</Badge> : null;
                            }) : <span className="text-muted-foreground">Nenhum</span>}
                        </div>
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
             <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Nenhum serviço cadastrado para esta unidade.</p>
            </div>
        )}
    </div>
  );
}

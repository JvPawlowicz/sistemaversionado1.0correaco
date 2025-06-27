
'use client';

import * as React from 'react';
import { useActionState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useUser } from '@/contexts/UserContext';
import { Loader2, Plus, SlidersHorizontal, UserCheck, CircleAlert, ChevronsUpDown, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createTimeBlockAction } from '@/lib/actions';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ManageAvailabilityDialog } from '@/components/planning/manage-availability-dialog';
import type { User } from '@/lib/types';


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
      <Plus className="mr-2" />
      Criar Bloqueio
    </Button>
  );
}

export default function PlanningPage() {
  const { users, loading: usersLoading, fetchUsers } = useUser();
  const { units, selectedUnitId } = useUnit();
  const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Coordinator');
  
  const [state, formAction] = useActionState(createTimeBlockAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const [blockType, setBlockType] = React.useState<'UNIT' | 'USERS'>('UNIT');
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  
  const handleManageAvailability = (user: User) => {
    setSelectedUser(user);
    setIsAvailabilityDialogOpen(true);
  }

  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      formRef.current?.reset();
      setDate(new Date());
      setBlockType('UNIT');
      setSelectedUserIds([]);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast]);

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const professionalsInUnit = users.filter(user => user.unitIds.includes(selectedUnitId || ''));

  return (
    <div className="space-y-6">
      {selectedUser && (
        <ManageAvailabilityDialog
          isOpen={isAvailabilityDialogOpen}
          onOpenChange={setIsAvailabilityDialogOpen}
          user={selectedUser}
          onAvailabilityUpdated={fetchUsers}
        />
      )}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Planejamento e Disponibilidade
        </h1>
        <p className="text-muted-foreground">
          Gerencie os horários dos profissionais e bloqueios da agenda.
        </p>
      </div>

       <Tabs defaultValue="blocks">
          <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="blocks">
              <SlidersHorizontal className="mr-2" />
              Bloqueios Gerais
            </TabsTrigger>
            <TabsTrigger value="availability">
              <UserCheck className="mr-2" />
              Disponibilidade de Profissionais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade de Profissionais</CardTitle>
                <CardDescription>
                  Defina os horários de trabalho, planejamento e supervisão para cada profissional da unidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : professionals.map(pro => (
                  <div key={pro.id} className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center gap-4">
                          <Avatar>
                              <AvatarImage src={pro.avatarUrl} alt={pro.name} />
                              <AvatarFallback>{getInitials(pro.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{pro.name}</p>
                              <p className="text-sm text-muted-foreground">{pro.role}</p>
                          </div>
                      </div>
                      <Button variant="outline" onClick={() => handleManageAvailability(pro)}>Gerenciar Horários</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="blocks">
            <form action={formAction} ref={formRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Criar Bloqueio na Agenda</CardTitle>
                  <CardDescription>
                      Crie bloqueios para eventos como reuniões, feriados ou formações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {state.message && !state.success && !state.errors && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <CircleAlert className="h-4 w-4" />
                        <p>{state.message}</p>
                    </div>
                   )}
                   {Object.values(state.errors || {}).map((error: any) => (
                        <div key={error[0]} className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            <CircleAlert className="h-4 w-4" />
                            <p>{error[0]}</p>
                        </div>
                    ))}

                  <input type="hidden" name="unitId" value={selectedUnitId || ''} />
                  <div className="space-y-2">
                    <Label htmlFor="block-title">Motivo do Bloqueio</Label>
                    <Input id="block-title" name="title" placeholder="Ex: Reunião de Equipe" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="block-date">Data</Label>
                      <input type="hidden" name="date" value={date ? format(date, 'yyyy-MM-dd') : ''} />
                      <DatePicker value={date} onChange={(d) => setDate(d ? startOfDay(d) : undefined)} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="block-start">Início</Label>
                      <Input id="block-start" name="startTime" type="time" defaultValue="09:00" required/>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="block-end">Fim</Label>
                      <Input id="block-end" name="endTime" type="time" defaultValue="10:00" required/>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md border p-4">
                    <Label>Aplicar Bloqueio Para</Label>
                    <RadioGroup value={blockType} onValueChange={(v) => setBlockType(v as any)} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UNIT" id="r-unit" />
                        <Label htmlFor="r-unit">Toda a Unidade</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="USERS" id="r-users" />
                        <Label htmlFor="r-users">Profissionais Específicos</Label>
                      </div>
                    </RadioGroup>
                    
                    {blockType === 'USERS' && (
                       <div className="space-y-2 pt-2">
                          <Label htmlFor="professionals">Profissionais</Label>
                          {selectedUserIds.map(id => <input key={id} type="hidden" name="userIds" value={id} />)}
                          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10" disabled={usersLoading}>
                                    <div className="flex gap-1 flex-wrap">
                                        {selectedUsers.length > 0 ? selectedUsers.map(u => <Badge variant="secondary" key={u.id}>{u.name}</Badge>) : "Selecione..."}
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
                                            {professionalsInUnit.map(u => (
                                                <CommandItem key={u.id} value={u.name} onSelect={() => setSelectedUserIds(p => p.includes(u.id) ? p.filter(id => id !== u.id) : [...p, u.id])}>
                                                    <Check className={cn('mr-2 h-4 w-4', selectedUserIds.includes(u.id) ? 'opacity-100' : 'opacity-0')} />
                                                    {u.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                          </Popover>
                       </div>
                    )}

                  </div>

                </CardContent>
                <CardFooter className="justify-end">
                   <SubmitButton />
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
       </Tabs>
    </div>
  );
}

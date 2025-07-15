
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useUser } from '@/contexts/UserContext';
import { Loader2, Plus, CircleAlert, ChevronsUpDown, Check } from 'lucide-react';
import { createTimeBlockAction } from '@/lib/actions/schedule';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CardFooter } from '@/components/ui/card';

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

export function TimeBlockManager() {
    const [state, formAction] = useFormState(createTimeBlockAction, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const { users, loading: usersLoading } = useUser();
    const { selectedUnitId } = useUnit();

    const [date, setDate] = useState<Date | undefined>();
    const [blockType, setBlockType] = useState<'UNIT' | 'USERS'>('UNIT');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        setDate(new Date());
    }, []);

    useEffect(() => {
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

    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    const professionalsInUnit = users.filter(user => Array.isArray(user.unitIds) && user.unitIds.includes(selectedUnitId || ''));

    return (
        <form action={formAction} ref={formRef}>
            <div className="space-y-6">
                {state.message && !state.success && !state.errors && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <CircleAlert className="h-4 w-4" />
                        <p>{state.message}</p>
                    </div>
                )}
                {state.errors && Object.values(state.errors).map((error: any, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
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
            </div>
            <CardFooter className="justify-end px-0 pt-6">
                <SubmitButton />
            </CardFooter>
        </form>
    );
}

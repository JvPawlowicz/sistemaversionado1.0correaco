'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { User, Availability } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateUserAvailabilityAction } from '@/lib/actions/schedule';
import { produce } from 'immer';

interface ManageAvailabilityDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  onAvailabilityUpdated: () => void;
}

const WEEK_DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export function ManageAvailabilityDialog({ isOpen, onOpenChange, user, onAvailabilityUpdated }: ManageAvailabilityDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [availability, setAvailability] = React.useState<Availability[]>([]);

  React.useEffect(() => {
    if (user?.availability) {
      setAvailability(JSON.parse(JSON.stringify(user.availability))); // Deep copy
    } else {
        setAvailability([]);
    }
  }, [user]);

  const handleAddTimeSlot = (dayOfWeek: number) => {
    setAvailability(
      produce(draft => {
        draft.push({
          dayOfWeek,
          type: 'Free',
          startTime: '09:00',
          endTime: '18:00',
        });
      })
    );
  };

  const handleRemoveTimeSlot = (index: number) => {
    setAvailability(
      produce(draft => {
        draft.splice(index, 1);
      })
    );
  };

  const handleTimeSlotChange = (index: number, field: keyof Availability, value: any) => {
    setAvailability(
      produce(draft => {
        (draft[index] as any)[field] = value;
      })
    );
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    // Basic validation
    for (const slot of availability) {
        if (slot.startTime >= slot.endTime) {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: `Em ${WEEK_DAYS[slot.dayOfWeek]}, o horário final deve ser maior que o inicial.` });
            setIsSaving(false);
            return;
        }
    }
    const result = await updateUserAvailabilityAction(user.id, availability);
    if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        onAvailabilityUpdated();
        onOpenChange(false);
    } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsSaving(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Disponibilidade de {user.name}</DialogTitle>
          <DialogDescription>
            Defina os horários de trabalho, planejamento e supervisão. Horários não definidos como &quot;Livre&quot; serão bloqueados para agendamentos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          {WEEK_DAYS.slice(1, 6).map((dayName, index) => {
            const dayOfWeek = index + 1;
            const daySlots = availability.filter(slot => slot.dayOfWeek === dayOfWeek);

            return (
              <div key={dayOfWeek} className="space-y-2 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{dayName}</h3>
                  <Button variant="ghost" size="sm" onClick={() => handleAddTimeSlot(dayOfWeek)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Horário
                  </Button>
                </div>
                {daySlots.length > 0 ? (
                  daySlots.map((slot, i) => {
                    const slotIndex = availability.findIndex(s => s === slot);
                    return (
                        <div key={slotIndex} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                                <Label className="sr-only">Tipo</Label>
                                <Select value={slot.type} onValueChange={(v) => handleTimeSlotChange(slotIndex, 'type', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Free">Livre (Atendimento)</SelectItem>
                                        <SelectItem value="Planning">Planejamento</SelectItem>
                                        <SelectItem value="Supervision">Supervisão</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <Label className="sr-only">Início</Label>
                                <Input type="time" value={slot.startTime} onChange={(e) => handleTimeSlotChange(slotIndex, 'startTime', e.target.value)} />
                            </div>
                             <div className="col-span-3">
                                <Label className="sr-only">Fim</Label>
                                <Input type="time" value={slot.endTime} onChange={(e) => handleTimeSlotChange(slotIndex, 'endTime', e.target.value)} />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveTimeSlot(slotIndex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        </div>
                    )
                  })
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">Fechado / Indisponível</p>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Disponibilidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
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
import { Loader2, CircleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from '@/contexts/UnitContext';
import { createHealthPlanAction } from '@/lib/actions/unit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface NewHealthPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPlanAdded: () => void;
}

const initialState = { success: false, message: '', errors: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Plano
    </Button>
  );
}

export function NewHealthPlanDialog({ isOpen, onOpenChange, onPlanAdded }: NewHealthPlanDialogProps) {
  const [state, formAction] = useFormState(createHealthPlanAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { units, loading: unitsLoading } = useUnit();
  
  const displayableUnits = units.filter(u => u.id !== 'central');

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      onPlanAdded();
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onPlanAdded, onOpenChange]);

  const handleClose = () => {
    formRef.current?.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Novo Plano de Saúde</DialogTitle>
            <DialogDescription>
              Cadastre um novo convênio e vincule-o a uma unidade específica ou a todas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nome do Plano</Label>
              <Input id="plan-name" name="name" placeholder="Ex: Unimed, SulAmérica" required />
              {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-color">Cor de Identificação</Label>
              <Input id="plan-color" name="color" type="color" defaultValue="#a78bfa" className="h-10 p-1" />
              {state.errors?.color && <p className="text-xs text-destructive mt-1">{state.errors.color[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="unitId">Unidade</Label>
                <Select name="unitId" required disabled={unitsLoading}>
                    <SelectTrigger id="unitId"><SelectValue placeholder="Selecione uma unidade..." /></SelectTrigger>
                    <SelectContent>
                        {displayableUnits.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                        ))}
                        <SelectItem value="central">Todas as Unidades (Central)</SelectItem>
                    </SelectContent>
                </Select>
                 {state.errors?.unitId && <p className="text-xs text-destructive mt-1">{state.errors.unitId[0]}</p>}
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

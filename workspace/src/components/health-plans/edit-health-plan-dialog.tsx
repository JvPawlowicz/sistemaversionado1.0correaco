'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useRef } from 'react';
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
import type { HealthPlanWithUnit } from '@/lib/types';
import { updateHealthPlanAction } from '@/lib/actions/unit';

interface EditHealthPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: HealthPlanWithUnit | null;
  onPlanChanged: () => void;
}

const initialState = { success: false, message: '', errors: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Alterações
    </Button>
  );
}

export function EditHealthPlanDialog({ isOpen, onOpenChange, plan, onPlanChanged }: EditHealthPlanDialogProps) {
  const [state, formAction] = useActionState(updateHealthPlanAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      onPlanChanged();
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onPlanChanged, onOpenChange]);
  
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Editar Plano de Saúde</DialogTitle>
            <DialogDescription>
              Altere os detalhes do plano <span className="font-semibold">{plan.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="planId" value={plan.id} />
            <input type="hidden" name="unitId" value={plan.unitId} />
            <div className="space-y-2">
              <Label htmlFor="edit-plan-name">Nome do Plano</Label>
              <Input id="edit-plan-name" name="name" defaultValue={plan.name} required />
              {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan-color">Cor de Identificação</Label>
              <Input id="edit-plan-color" name="color" type="color" defaultValue={plan.color} className="h-10 p-1" />
              {state.errors?.color && <p className="text-xs text-destructive mt-1">{state.errors.color[0]}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="unitName">Unidade</Label>
              <Input id="unitName" value={plan.unitName} disabled />
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

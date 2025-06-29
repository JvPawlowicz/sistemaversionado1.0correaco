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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { HealthPlanWithUnit } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { deleteHealthPlanAction } from '@/lib/actions';

interface DeleteHealthPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: HealthPlanWithUnit | null;
  onPlanChanged: () => void;
}

export function DeleteHealthPlanDialog({ isOpen, onOpenChange, plan, onPlanChanged }: DeleteHealthPlanDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!plan) return;
    setIsDeleting(true);
    const result = await deleteHealthPlanAction(plan.id, plan.unitId);
    setIsDeleting(false);

    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      onPlanChanged();
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  if (!plan) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o plano <span className="font-semibold">{plan.name}</span> da unidade <span className="font-semibold">{plan.unitName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

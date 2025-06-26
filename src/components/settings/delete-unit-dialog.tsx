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
import type { Unit } from '@/lib/types';
import { deleteUnitAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';

interface DeleteUnitDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  unit: Unit | null;
}

export function DeleteUnitDialog({ isOpen, onOpenChange, unit }: DeleteUnitDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();
  const { fetchUnits } = useUnit();

  const handleDelete = async () => {
    if (!unit) return;
    setIsDeleting(true);
    const result = await deleteUnitAction(unit.id);
    setIsDeleting(false);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      await fetchUnits();
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  if (!unit) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a unidade <span className="font-semibold">{unit.name}</span>? Esta ação é permanente e removerá a unidade do sistema e dos perfis de todos os usuários vinculados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

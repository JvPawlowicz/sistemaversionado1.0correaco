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
import type { Patient } from '@/lib/types';
import { deletePatientAction } from '@/lib/actions/patient';
import { Loader2 } from 'lucide-react';

interface DeletePatientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patient: Patient | null;
  onPatientDeleted: () => void;
}

export function DeletePatientDialog({ isOpen, onOpenChange, patient, onPatientDeleted }: DeletePatientDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!patient) return;
    setIsDeleting(true);
    const result = await deletePatientAction(patient.id);
    setIsDeleting(false);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      onPatientDeleted();
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  if (!patient) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o paciente <span className="font-semibold">{patient.name}</span>? Esta ação é permanente e removerá todos os dados do paciente do sistema, incluindo prontuários e documentos.
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

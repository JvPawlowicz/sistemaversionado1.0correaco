
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Unit } from '@/lib/types';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface HealthPlanManagerProps {
  unit: Unit;
}

export function HealthPlanManager({ unit }: HealthPlanManagerProps) {
  const { addHealthPlanToUnit, deleteHealthPlan } = useUnit();
  const [newPlanName, setNewPlanName] = React.useState('');
  const [newPlanColor, setNewPlanColor] = React.useState('#a78bfa');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    setIsSaving(true);
    const currentPlans = unit.healthPlans || [];
    if (currentPlans.map(p => p.name.toLowerCase()).includes(newPlanName.trim().toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Plano de saúde já existe',
        });
        setIsSaving(false);
        return;
    }
    await addHealthPlanToUnit(unit.id, { name: newPlanName.trim(), color: newPlanColor });
    setNewPlanName('');
    setIsSaving(false);
    setIsAddDialogOpen(false);
  };

  const handleDeletePlan = async (planId: string) => {
    await deleteHealthPlan(unit.id, planId);
  };

  return (
    <div className="space-y-4">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddPlan}>
            <DialogHeader>
              <DialogTitle>Novo Plano de Saúde</DialogTitle>
              <DialogDescription>
                Cadastre um novo plano de saúde ou convênio aceito nesta unidade.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input
                  id="plan-name"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="Ex: Unimed, SulAmérica"
                  required
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="plan-color">Cor de Identificação</Label>
                 <Input
                    id="plan-color"
                    type="color"
                    value={newPlanColor}
                    onChange={(e) => setNewPlanColor(e.target.value)}
                    className="h-10 p-1"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSaving || !newPlanName.trim()}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Plano
        </Button>
      </div>
      <div className="space-y-2 rounded-md border p-4">
        <h4 className="font-medium">Planos Cadastrados</h4>
        {(unit.healthPlans && unit.healthPlans.length > 0) ? (
          <ul className="space-y-2">
            {unit.healthPlans.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between rounded-md bg-secondary/50 p-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span>{plan.name}</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o plano &quot;{plan.name}&quot;?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Não</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano de saúde cadastrado nesta unidade.</p>
        )}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useImmer } from 'use-immer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updatePatientTreatmentPlanAction } from '@/lib/actions/patient';
import type { Patient, TreatmentPlan, TreatmentGoal, TreatmentObjective } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ManageTreatmentPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patient: Patient;
  onPlanUpdated: () => void;
}

export function ManageTreatmentPlanDialog({ isOpen, onOpenChange, patient, onPlanUpdated }: ManageTreatmentPlanDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [plan, setPlan] = useImmer<TreatmentPlan>(patient.treatmentPlan || { goals: [] });
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const [errors, setErrors] = React.useState<Record<string, string[]> | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPlan(patient.treatmentPlan || { goals: [] });
      setErrors(null);
    }
  }, [isOpen, patient.treatmentPlan, setPlan]);

  const handleAddGoal = () => {
    setPlan(draft => {
      draft.goals.push({
        id: crypto.randomUUID(),
        description: '',
        objectives: [],
      });
    });
  };

  const handleRemoveGoal = (goalIndex: number) => {
    setPlan(draft => {
      draft.goals.splice(goalIndex, 1);
    });
  };

  const handleAddObjective = (goalIndex: number) => {
    setPlan(draft => {
      draft.goals[goalIndex].objectives.push({
        id: crypto.randomUUID(),
        description: '',
        status: 'Não Iniciado',
        masteryCriterion: '',
        dataCollectionType: 'Tentativas',
      });
    });
  };

  const handleRemoveObjective = (goalIndex: number, objectiveIndex: number) => {
    setPlan(draft => {
      draft.goals[goalIndex].objectives.splice(objectiveIndex, 1);
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors(null);

    const result = await updatePatientTreatmentPlanAction(patient.id, plan);
    setIsSaving(false);

    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      onPlanUpdated();
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: result.message });
      if (result.errors) {
        setErrors(result.errors.fieldErrors);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Plano Terapêutico Individual (PTI)</DialogTitle>
          <DialogDescription>
            Defina as metas e objetivos para o paciente {patient.name}.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="space-y-6">
              {plan.goals.map((goal, goalIndex) => (
                <div key={goal.id} className="p-4 border rounded-lg space-y-4 bg-card">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`goal-${goalIndex}`} className="text-base font-semibold">Meta de Longo Prazo</Label>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive ml-auto" onClick={() => handleRemoveGoal(goalIndex)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    id={`goal-${goalIndex}`}
                    placeholder="Ex: Melhorar a comunicação funcional"
                    value={goal.description}
                    onChange={e => setPlan(draft => { draft.goals[goalIndex].description = e.target.value; })}
                    className={cn(errors?.[`goals.${goalIndex}.description`] && "border-destructive")}
                  />
                   {errors?.[`goals.${goalIndex}.description`] && (
                    <p className="text-sm text-destructive">{errors[`goals.${goalIndex}.description`][0]}</p>
                  )}
                  <div className="pl-4 border-l-2 border-primary/50 space-y-3">
                    <h4 className="font-semibold text-muted-foreground">Objetivos de Curto Prazo</h4>
                    {goal.objectives.map((objective, objectiveIndex) => (
                      <div key={objective.id} className="p-3 border rounded-md bg-background space-y-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`objective-${goalIndex}-${objectiveIndex}`} className="sr-only">Descrição do Objetivo</Label>
                          <Textarea
                            id={`objective-${goalIndex}-${objectiveIndex}`}
                            placeholder="Ex: Apontar para 3 objetos desejados"
                            rows={1}
                            className={cn("flex-grow", errors?.[`goals.${goalIndex}.objectives.${objectiveIndex}.description`] && "border-destructive")}
                            value={objective.description}
                            onChange={e => setPlan(draft => { draft.goals[goalIndex].objectives[objectiveIndex].description = e.target.value; })}
                          />
                           <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveObjective(goalIndex, objectiveIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                         {errors?.[`goals.${goalIndex}.objectives.${objectiveIndex}.description`] && (
                            <p className="text-sm text-destructive">{errors[`goals.${goalIndex}.objectives.${objectiveIndex}.description`][0]}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`status-${goalIndex}-${objectiveIndex}`}>Status</Label>
                            <Select
                                value={objective.status}
                                onValueChange={value => setPlan(draft => { draft.goals[goalIndex].objectives[objectiveIndex].status = value as any; })}
                            >
                                <SelectTrigger id={`status-${goalIndex}-${objectiveIndex}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
                                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                    <SelectItem value="Pausa">Pausa</SelectItem>
                                    <SelectItem value="Atingido">Atingido</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`collection-${goalIndex}-${objectiveIndex}`}>Coleta de Dados</Label>
                             <Select
                                value={objective.dataCollectionType}
                                onValueChange={value => setPlan(draft => { draft.goals[goalIndex].objectives[objectiveIndex].dataCollectionType = value as any; })}
                            >
                                <SelectTrigger id={`collection-${goalIndex}-${objectiveIndex}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tentativas">Tentativas (% de acerto)</SelectItem>
                                    <SelectItem value="Frequência">Frequência (contagem)</SelectItem>
                                    <SelectItem value="Duração">Duração (tempo)</SelectItem>
                                    <SelectItem value="Latência">Latência (tempo de resposta)</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>
                           <div className="space-y-1">
                            <Label htmlFor={`criterion-${goalIndex}-${objectiveIndex}`}>Critério de Mestria</Label>
                            <Input
                                id={`criterion-${goalIndex}-${objectiveIndex}`}
                                placeholder="Ex: 90% em 3 dias"
                                value={objective.masteryCriterion}
                                onChange={e => setPlan(draft => { draft.goals[goalIndex].objectives[objectiveIndex].masteryCriterion = e.target.value; })}
                                className={cn(errors?.[`goals.${goalIndex}.objectives.${objectiveIndex}.masteryCriterion`] && "border-destructive")}
                            />
                             {errors?.[`goals.${goalIndex}.objectives.${objectiveIndex}.masteryCriterion`] && (
                                <p className="text-sm text-destructive">{errors[`goals.${goalIndex}.objectives.${objectiveIndex}.masteryCriterion`][0]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddObjective(goalIndex)}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Objetivo
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" className="w-full" onClick={handleAddGoal}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Meta de Longo Prazo
              </Button>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Plano Terapêutico
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

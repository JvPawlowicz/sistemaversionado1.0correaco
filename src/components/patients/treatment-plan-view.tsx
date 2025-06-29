
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Plus, CheckCircle2, PauseCircle, PlayCircle, Clock } from 'lucide-react';
import type { Patient, TreatmentGoal, TreatmentObjective } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ManageTreatmentPlanDialog } from './manage-treatment-plan-dialog';

interface TreatmentPlanViewProps {
  patient: Patient;
  onPlanUpdated: () => void;
}

const statusConfig: Record<TreatmentObjective['status'], { icon: React.ElementType, color: string, label: string }> = {
    'Não Iniciado': { icon: Clock, color: 'text-muted-foreground', label: 'Não Iniciado' },
    'Em Andamento': { icon: PlayCircle, color: 'text-blue-500', label: 'Em Andamento' },
    'Atingido': { icon: CheckCircle2, color: 'text-green-500', label: 'Atingido' },
    'Pausa': { icon: PauseCircle, color: 'text-yellow-500', label: 'Pausa' },
}

export function TreatmentPlanView({ patient, onPlanUpdated }: TreatmentPlanViewProps) {
  const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
  const plan = patient.treatmentPlan;
  
  const canManage = true; // TODO: Add role check from useAuth

  return (
    <>
      <ManageTreatmentPlanDialog
        isOpen={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        patient={patient}
        onPlanUpdated={onPlanUpdated}
      />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Plano Terapêutico Individual (PTI)</CardTitle>
              <CardDescription>Metas de longo prazo e objetivos de curto prazo para o tratamento.</CardDescription>
            </div>
            {canManage && (
              <Button onClick={() => setIsManageDialogOpen(true)}>
                <Target className="mr-2 h-4 w-4" />
                Gerenciar Plano
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {plan && plan.goals.length > 0 ? (
            plan.goals.map((goal, index) => (
              <div key={goal.id} className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg text-primary">Meta {index + 1}: {goal.description}</h3>
                <div className="space-y-3 pl-4">
                  {goal.objectives.length > 0 ? goal.objectives.map((objective) => {
                    const StatusIcon = statusConfig[objective.status].icon;
                    return (
                        <div key={objective.id} className="p-3 rounded-md bg-secondary/50">
                            <div className="flex items-center gap-2">
                               <StatusIcon className={`h-5 w-5 ${statusConfig[objective.status].color}`} />
                               <p className="flex-1 font-medium">{objective.description}</p>
                               <Badge variant="outline">{objective.dataCollectionType}</Badge>
                            </div>
                            {objective.masteryCriterion && <p className="text-xs text-muted-foreground mt-1 pl-7"><strong>Critério:</strong> {objective.masteryCriterion}</p>}
                        </div>
                    );
                  }) : <p className="text-sm text-muted-foreground">Nenhum objetivo de curto prazo definido para esta meta.</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
              <Target className="h-12 w-12" />
              <p>Nenhum Plano Terapêutico Individual (PTI) definido para este paciente.</p>
              {canManage && <Button onClick={() => setIsManageDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Plano Terapêutico
              </Button>}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

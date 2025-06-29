
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Plus, CheckCircle2, PauseCircle, PlayCircle, Clock, LineChart } from 'lucide-react';
import type { Patient, TreatmentGoal, TreatmentObjective, EvolutionRecord } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ManageTreatmentPlanDialog } from './manage-treatment-plan-dialog';
import { ObjectiveProgressChartDialog } from './objective-progress-chart-dialog';

interface TreatmentPlanViewProps {
  patient: Patient;
  onPlanUpdated: () => void;
  evolutionRecords: EvolutionRecord[];
  recordsLoading: boolean;
}

const statusConfig: Record<TreatmentObjective['status'], { icon: React.ElementType, color: string, label: string }> = {
    'Não Iniciado': { icon: Clock, color: 'text-muted-foreground', label: 'Não Iniciado' },
    'Em Andamento': { icon: PlayCircle, color: 'text-blue-500', label: 'Em Andamento' },
    'Atingido': { icon: CheckCircle2, color: 'text-green-500', label: 'Atingido' },
    'Pausa': { icon: PauseCircle, color: 'text-yellow-500', label: 'Pausa' },
}

export function TreatmentPlanView({ patient, onPlanUpdated, evolutionRecords, recordsLoading }: TreatmentPlanViewProps) {
  const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
  const [isChartDialogOpen, setIsChartDialogOpen] = React.useState(false);
  const [selectedObjective, setSelectedObjective] = React.useState<TreatmentObjective | null>(null);
  
  const plan = patient.treatmentPlan;
  
  const handleChartClick = (objective: TreatmentObjective) => {
    setSelectedObjective(objective);
    setIsChartDialogOpen(true);
  }
  
  const canManage = true; // TODO: Add role check from useAuth

  return (
    <>
      <ManageTreatmentPlanDialog
        isOpen={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        patient={patient}
        onPlanUpdated={onPlanUpdated}
      />
      {selectedObjective && (
        <ObjectiveProgressChartDialog
            isOpen={isChartDialogOpen}
            onOpenChange={setIsChartDialogOpen}
            objective={selectedObjective}
            evolutionRecords={evolutionRecords}
            isLoading={recordsLoading}
        />
      )}
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
                            <div className="flex items-start gap-2">
                               <StatusIcon className={`h-5 w-5 mt-0.5 ${statusConfig[objective.status].color}`} />
                               <div className="flex-1">
                                <p className="font-medium">{objective.description}</p>
                                {objective.masteryCriterion && <p className="text-xs text-muted-foreground mt-1"><strong>Critério:</strong> {objective.masteryCriterion}</p>}
                               </div>
                               <Badge variant="outline">{objective.dataCollectionType}</Badge>
                               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleChartClick(objective)}>
                                    <LineChart className="h-4 w-4" />
                               </Button>
                            </div>
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


'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TreatmentObjective, EvolutionRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ObjectiveProgressChartDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  objective: TreatmentObjective | null;
  evolutionRecords: EvolutionRecord[];
  isLoading: boolean;
}

export function ObjectiveProgressChartDialog({
  isOpen,
  onOpenChange,
  objective,
  evolutionRecords,
  isLoading,
}: ObjectiveProgressChartDialogProps) {

  const chartData = React.useMemo(() => {
    if (!objective || !evolutionRecords) return [];

    return evolutionRecords
      .filter(record => record.objectiveProgress && record.objectiveProgress[objective.id])
      .map(record => {
        const progress = record.objectiveProgress![objective.id];
        let yValue: number | null = null;
        if (progress.type === 'Tentativas' && progress.total && progress.total > 0) {
            yValue = (progress.value / progress.total) * 100;
        } else if (progress.type !== 'Tentativas') {
            yValue = progress.value;
        }

        return {
            date: record.createdAt?.toDate(),
            value: yValue,
            label: `${yValue?.toFixed(0) ?? 'N/A'}${progress.type === 'Tentativas' ? '%' : ''}`
        };
      })
      .filter(item => item.value !== null && item.date)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime())
       .map(item => ({...item, date: format(item.date!, 'dd/MM')}));

  }, [evolutionRecords, objective]);
  
  const masteryCriterionValue = React.useMemo(() => {
    if (!objective?.masteryCriterion) return null;
    const match = objective.masteryCriterion.match(/(\d+)\s*%/);
    return match ? parseInt(match[1], 10) : null;
  }, [objective]);


  if (!objective) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gráfico de Progresso do Objetivo</DialogTitle>
          <DialogDescription>
            {objective.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : chartData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Evolução ao Longo do Tempo</CardTitle>
                        <CardDescription>
                            Critério de Mestria: {objective.masteryCriterion}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                value: { label: objective.dataCollectionType, color: "hsl(var(--primary))" },
                            }}
                            className="h-64 w-full"
                        >
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8} 
                                    domain={[0, 100]}
                                    tickFormatter={(value) => objective.dataCollectionType === 'Tentativas' ? `${value}%` : value}
                                />
                                 {masteryCriterionValue !== null && (
                                    <ReferenceLine y={masteryCriterionValue} label={{ value: "Mestria", position: 'insideTopRight' }} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
                                 )}
                                <ChartTooltip 
                                    cursor={false} 
                                    content={<ChartTooltipContent 
                                        indicator="dot"
                                        labelKey='label'
                                    />}
                                />
                                <Line
                                    dataKey="value"
                                    type="monotone"
                                    stroke="var(--color-value)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--color-value)" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex justify-center items-center h-64 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Nenhum dado de progresso registrado para este objetivo ainda.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

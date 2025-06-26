'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, isWithinInterval, startOfDay } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartPie } from '@/components/ui/chart';
import type { Appointment } from '@/lib/types';


interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  loading: boolean;
}

function StatCard({ title, value, icon: Icon, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-1/4 mt-1" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const chartConfig = {
  realizado: { label: 'Realizado', color: 'hsl(var(--chart-2))' },
  agendado: { label: 'Agendado', color: 'hsl(var(--chart-4))' },
  faltou: { label: 'Faltou', color: 'hsl(var(--chart-5))' },
  cancelado: { label: 'Cancelado', color: 'hsl(var(--muted))' },
} satisfies ChartConfig;


export default function AnalysisPage() {
  const { appointments, loading } = useSchedule();

  const analysisData = React.useMemo(() => {
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, 30));

    const appointmentsInPeriod = appointments.filter(app =>
      isWithinInterval(new Date(app.date + 'T00:00:00'), { start: startDate, end: endDate })
    );

    const total = appointmentsInPeriod.length;
    const realizado = appointmentsInPeriod.filter(app => app.status === 'Realizado').length;
    const faltou = appointmentsInPeriod.filter(app => app.status === 'Faltou').length;
    const agendado = appointmentsInPeriod.filter(app => app.status === 'Agendado').length;
    const cancelado = appointmentsInPeriod.filter(app => app.status === 'Cancelado').length;

    const possibleSlots = realizado + faltou + agendado;
    const occupationRate = possibleSlots > 0 ? (realizado / possibleSlots * 100).toFixed(1) : '0.0';
    const absenceRate = possibleSlots > 0 ? (faltou / possibleSlots * 100).toFixed(1) : '0.0';

    const chartData = [
        { status: 'realizado', count: realizado, fill: 'var(--color-realizado)' },
        { status: 'agendado', count: agendado, fill: 'var(--color-agendado)' },
        { status: 'faltou', count: faltou, fill: 'var(--color-faltou)' },
        { status: 'cancelado', count: cancelado, fill: 'var(--color-cancelado)' },
    ].filter(item => item.count > 0);

    return { total, realizado, faltou, agendado, occupationRate, absenceRate, chartData };
  }, [appointments]);


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Análise e Desempenho
        </h1>
        <p className="text-muted-foreground">
          Visualize o desempenho da clínica com dados e gráficos avançados dos últimos 30 dias.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taxa de Ocupação"
          value={`${analysisData.occupationRate}%`}
          icon={TrendingUp}
          description="De agendamentos não cancelados"
          loading={loading}
        />
        <StatCard
          title="Taxa de Faltas"
          value={`${analysisData.absenceRate}%`}
          icon={TrendingDown}
          description="De agendamentos não cancelados"
          loading={loading}
        />
        <StatCard
          title="Atendimentos Realizados"
          value={analysisData.realizado}
          icon={Activity}
          description="Total de sessões concluídas"
          loading={loading}
        />
         <StatCard
          title="Total de Agendamentos"
          value={analysisData.total}
          icon={Clock}
          description="Incluindo cancelados"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Visão Geral dos Atendimentos</CardTitle>
            <CardDescription>Distribuição de status dos agendamentos nos últimos 30 dias.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? <Skeleton className="h-64 w-full" /> : analysisData.chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <ChartPie data={analysisData.chartData} nameKey="status" dataKey="count">
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                </ChartPie>
            </ChartContainer>
            ) : (
                 <div className="flex h-64 items-center justify-center text-muted-foreground">
                    <p>Nenhum dado de agendamento no período para exibir o gráfico.</p>
                 </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Appointment } from '@/lib/types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface AppointmentsChartProps {
  appointments: Appointment[];
}

export function AppointmentsChart({ appointments }: AppointmentsChartProps) {
    
  const chartData = React.useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const monthlyAppointments = appointments.filter(app => 
        isWithinInterval(new Date(app.date + 'T00:00:00'), { start: monthStart, end: monthEnd })
    );

    const counts = monthlyAppointments.reduce((acc, app) => {
        const serviceName = app.serviceName || 'Não especificado';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([serviceName, count]) => ({
      serviceName,
      count,
    }));
  }, [appointments]);

  const chartConfig = {
    count: {
      label: 'Atendimentos',
      color: 'hsl(var(--primary))',
    },
    serviceName: {
      label: 'Serviço',
    },
  } satisfies ChartConfig;

  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
            <p>Nenhum dado de atendimento para este mês.</p>
        </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-64">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="serviceName"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 10)}
        />
        <YAxis />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

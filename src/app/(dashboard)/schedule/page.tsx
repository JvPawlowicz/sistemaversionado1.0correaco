import { ScheduleView } from '@/components/schedule/schedule-view';

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Gestão de Agenda
            </h1>
            <p className="text-muted-foreground">
                Visualize e gerencie agendamentos por dia ou mês.
            </p>
        </div>
      </div>
      <ScheduleView />
    </div>
  );
}

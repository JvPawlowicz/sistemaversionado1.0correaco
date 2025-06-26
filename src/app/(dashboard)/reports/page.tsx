import { ReportsView } from '@/components/reports/reports-view';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Relatórios
            </h1>
            <p className="text-muted-foreground">
                Filtre e visualize dados de agendamentos para análise.
            </p>
        </div>
      </div>
      <ReportsView />
    </div>
  );
}

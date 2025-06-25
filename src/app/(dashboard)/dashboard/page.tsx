import { ScheduleCalendar } from '@/components/dashboard/schedule-calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Bem-vindo(a) de volta, Dr(a). Reed!
        </h1>
        <p className="text-muted-foreground">
          Aqui está o que está acontecendo hoje.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agenda de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

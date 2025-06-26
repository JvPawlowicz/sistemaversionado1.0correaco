
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Planejamento e Disponibilidade
        </h1>
        <p className="text-muted-foreground">
          Gerencie os horários dos profissionais e bloqueios da agenda.
        </p>
      </div>

       <Card className="mt-8">
        <CardHeader className="items-center text-center">
          <Lightbulb className="h-12 w-12 text-primary" />
          <CardTitle className="text-2xl">Módulo em Construção</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground">
                Esta funcionalidade permitirá o gerenciamento avançado de horários, incluindo disponibilidade,
                <br/>
                bloqueios para planejamento, supervisão e reuniões.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}

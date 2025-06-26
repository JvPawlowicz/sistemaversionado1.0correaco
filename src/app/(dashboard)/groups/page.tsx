
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users2 } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Grupos de Terapia
        </h1>
        <p className="text-muted-foreground">
          Crie e gerencie os grupos de atendimento.
        </p>
      </div>

       <Card className="mt-8">
        <CardHeader className="items-center text-center">
          <Users2 className="h-12 w-12 text-primary" />
          <CardTitle className="text-2xl">Módulo em Construção</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground">
                Esta seção permitirá criar grupos de terapia, vincular pacientes e profissionais,
                <br />
                 e registrar evoluções de grupo.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}

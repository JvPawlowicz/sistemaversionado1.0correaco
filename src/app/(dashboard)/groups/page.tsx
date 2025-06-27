'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users2, PlusCircle, User, Stethoscope } from 'lucide-react';
import { useTherapyGroup } from '@/contexts/TherapyGroupContext';
import { NewTherapyGroupDialog } from '@/components/groups/new-therapy-group-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnit } from '@/contexts/UnitContext';
import { Badge } from '@/components/ui/badge';

export default function GroupsPage() {
  const { therapyGroups, loading } = useTherapyGroup();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { units } = useUnit();

  const getServiceName = (serviceId: string) => {
    for (const unit of units) {
      const service = unit.services?.find(s => s.id === serviceId);
      if (service) return service.name;
    }
    return 'Serviço não encontrado';
  };

  return (
    <div className="space-y-6">
      <NewTherapyGroupDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Gestão de Grupos de Terapia
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie os grupos de atendimento da unidade.
          </p>
        </div>
         <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Grupo
        </Button>
      </div>

       {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : therapyGroups.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                <CardHeader>
                    <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Nenhum Grupo Cadastrado</CardTitle>
                    <CardDescription>Comece criando o primeiro grupo de terapia para esta unidade.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Primeiro Grupo
                    </Button>
                </CardFooter>
            </Card>
        ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {therapyGroups.map(group => (
                <Card key={group.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users2 className="text-primary" />
                        {group.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{getServiceName(group.serviceId)}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{group.patientIds.length} Paciente(s)</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Stethoscope className="h-4 w-4" />
                        <span>{group.professionalIds.length} Profissional(is)</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" disabled>Gerenciar</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
        )}
    </div>
  );
}

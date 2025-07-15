

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, SlidersHorizontal } from 'lucide-react';
import { AvailabilityManager } from '@/components/planning/availability-manager';
import { TimeBlockManager } from '@/components/planning/time-block-manager';


export default function PlanningPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // or a skeleton loader
  }

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

       <Tabs defaultValue="availability">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="availability">
              <UserCheck className="mr-2" />
              Disponibilidade de Profissionais
            </TabsTrigger>
             <TabsTrigger value="blocks">
              <SlidersHorizontal className="mr-2" />
              Bloqueios Gerais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade de Profissionais</CardTitle>
                <CardDescription>
                  Defina os horários de trabalho, planejamento e supervisão para cada profissional da unidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AvailabilityManager />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="blocks">
             <Card>
                <CardHeader>
                  <CardTitle>Criar Bloqueio na Agenda</CardTitle>
                  <CardDescription>
                      Crie bloqueios para eventos como reuniões, feriados ou formações.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeBlockManager />
                </CardContent>
              </Card>
          </TabsContent>
       </Tabs>
    </div>
  );
}


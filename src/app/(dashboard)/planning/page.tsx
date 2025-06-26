'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useUser } from '@/contexts/UserContext';
import { Loader2, Plus, SlidersHorizontal, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlanningPage() {
  const { users, loading: usersLoading } = useUser();
  const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Coordinator');
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
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
                {usersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : professionals.map(pro => (
                  <div key={pro.id} className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center gap-4">
                          <Avatar>
                              <AvatarImage src={pro.avatarUrl} alt={pro.name} />
                              <AvatarFallback>{getInitials(pro.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{pro.name}</p>
                              <p className="text-sm text-muted-foreground">{pro.role}</p>
                          </div>
                      </div>
                      <Button variant="outline" disabled>Gerenciar Horários</Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                  <p className="text-xs text-muted-foreground">
                      * Funcionalidade de gerenciamento de horários individuais em breve.
                  </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="blocks">
             <Card>
              <CardHeader>
                <CardTitle>Bloqueios na Agenda</CardTitle>
                <CardDescription>
                    Crie bloqueios para eventos como reuniões, feriados ou formações, que se aplicarão a toda a unidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="block-title">Motivo do Bloqueio</Label>
                  <Input id="block-title" placeholder="Ex: Reunião de Equipe" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="block-date">Data</Label>
                    <DatePicker onChange={() => {}} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="block-start">Início</Label>
                    <Input id="block-start" type="time" defaultValue="09:00"/>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="block-end">Fim</Label>
                    <Input id="block-end" type="time" defaultValue="10:00" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                 <p className="text-xs text-muted-foreground">
                      * A funcionalidade de salvar bloqueios será implementada em breve.
                  </p>
                 <Button disabled>
                    <Plus className="mr-2" />
                    Criar Bloqueio
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
       </Tabs>
    </div>
  );
}

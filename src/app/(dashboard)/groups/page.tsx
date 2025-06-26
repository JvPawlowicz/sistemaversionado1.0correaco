'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users2, PlusCircle } from 'lucide-react';
// import { useTherapyGroups } from '@/contexts/TherapyGroupContext'; // Future context

export default function GroupsPage() {
  // const { groups, loading } = useTherapyGroups(); // Future implementation
  const groups: any[] = []; // Placeholder
  const loading = false; // Placeholder

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Gestão de Grupos de Terapia
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie os grupos de atendimento da unidade.
          </p>
        </div>
         <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Grupo
        </Button>
      </div>

       {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader><CardTitle><Users2 className="h-8 w-8 text-muted-foreground"/></CardTitle></CardHeader><CardContent>Carregando...</CardContent></Card>
                <Card><CardHeader><CardTitle><Users2 className="h-8 w-8 text-muted-foreground"/></CardTitle></CardHeader><CardContent>Carregando...</CardContent></Card>
            </div>
        ) : groups.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                <CardHeader>
                    <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Nenhum Grupo Cadastrado</CardTitle>
                    <CardDescription>Comece criando o primeiro grupo de terapia para esta unidade.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Primeiro Grupo
                    </Button>
                </CardFooter>
            </Card>
        ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Map over groups here */}
            </div>
        )}
    </div>
  );
}

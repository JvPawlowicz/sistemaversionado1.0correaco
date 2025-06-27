'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function EvolutionsPage() {
    
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Gestão de Evoluções
          </h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie as evoluções pendentes e concluídas.
          </p>
        </div>
         <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por paciente ou profissional..."
                    className="pl-8 sm:w-[300px]"
                />
            </div>
            <Button variant="outline" disabled>Lembrar Todos</Button>
        </div>
      </div>
        <Card>
            <CardHeader>
                <CardTitle>Evoluções Pendentes</CardTitle>
                <CardDescription>Agendamentos que ocorreram mas ainda não tiveram a evolução registrada.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Funcionalidade em Breve</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Em breve, esta área listará todas as evoluções pendentes e permitirá ações de acompanhamento.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}


'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Terminal, Building } from 'lucide-react';
import Link from 'next/link';
import { useUnit } from '@/contexts/UnitContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function UnitsPage() {
  const { units, loading, error } = useUnit();
  // Filter out the "Central" unit from the list to be displayed
  const displayableUnits = units.filter(u => u.id !== 'central');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Gestão de Unidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie as unidades e seus respectivos serviços.
          </p>
        </div>
        <Button asChild>
          <Link href="/units/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Unidade
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : displayableUnits.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
            <CardHeader>
                <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>Nenhuma Unidade Cadastrada</CardTitle>
                <CardDescription>Comece adicionando a primeira unidade da sua clínica.</CardDescription>
            </CardHeader>
            <CardFooter>
                 <Button asChild>
                    <Link href="/units/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Unidade
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayableUnits.map((unit) => (
            <Card key={unit.id} className="flex flex-col">
              <CardHeader className="p-0">
                <div className="relative h-40 w-full">
                  <Image
                    src={unit.photoUrl || 'https://placehold.co/600x400.png'}
                    alt={unit.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg"
                    data-ai-hint="clinic building"
                  />
                </div>
                <div className="p-6">
                    <CardTitle>{unit.name}</CardTitle>
                    <CardDescription>{unit.address?.city || 'Endereço não informado'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground line-clamp-2">
                    {unit.services && unit.services.length > 0
                        ? `Serviços: ${unit.services.map(s => s.name).join(', ')}`
                        : 'Nenhum serviço cadastrado.'
                    }
                 </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/units/${unit.id}`}>Gerenciar</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

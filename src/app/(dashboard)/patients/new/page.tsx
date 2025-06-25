'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as React from 'react';
import { usePatient } from '@/contexts/PatientContext';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/lib/types';

export default function NewPatientPage() {
  const [name, setName] = React.useState('');
  const { addPatient } = usePatient();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPatient: Patient = {
      id: `CF${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      email: `${name.trim().split(' ')[0].toLowerCase()}@example.com`,
      phone: '(00) 00000-0000',
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'Active',
      avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
      dob: 'N/A',
      gender: 'Other',
    };
    
    addPatient(newPatient);
    router.push('/patients');
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Adicionar Novo Paciente
        </h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Paciente</CardTitle>
            <CardDescription>Preencha o nome do novo paciente abaixo para o MVP.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Digite o nome do paciente" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
             <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" asChild>
                  <Link href="/patients">Cancelar</Link>
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

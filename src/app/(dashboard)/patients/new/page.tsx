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
import { Loader2 } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';

export default function NewPatientPage() {
  const [name, setName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const { addPatient } = usePatient();
  const { selectedUnitId } = useUnit();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedUnitId) return;
    setIsSaving(true);

    const newPatientData: Omit<Patient, 'id' | 'lastVisit' | 'status' | 'avatarUrl' | 'createdAt'> = {
      name: name.trim(),
      email: `${name.trim().split(' ')[0].toLowerCase()}@example.com`,
      phone: '(00) 00000-0000',
      dob: 'N/A',
      gender: 'Other',
      unitIds: [selectedUnitId],
    };
    
    await addPatient(newPatientData);
    setIsSaving(false);
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
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
             <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" asChild>
                  <Link href="/patients">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSaving || !selectedUnitId}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

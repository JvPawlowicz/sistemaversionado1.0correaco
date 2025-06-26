'use client';

import Link from 'next/link';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePatient } from '@/contexts/PatientContext';
import { useUnit } from '@/contexts/UnitContext';
import type { Patient } from '@/lib/types';

const patientFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function NewPatientPage() {
  const [isSaving, setIsSaving] = React.useState(false);
  const { addPatient } = usePatient();
  const { selectedUnitId } = useUnit();
  const router = useRouter();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(data: PatientFormValues) {
    if (!selectedUnitId) return;
    setIsSaving(true);

    const newPatientData: Omit<Patient, 'id' | 'lastVisit' | 'status' | 'avatarUrl' | 'createdAt'> = {
      name: data.name,
      email: `${data.name.replace(/\s+/g, '.').toLowerCase()}@placeholder.email`,
      phone: '(00) 00000-0000',
      dob: new Date(1990, 0, 1).toISOString().split('T')[0], // Default DOB
      gender: 'Other',
      unitIds: [selectedUnitId],
    };
    
    await addPatient(newPatientData);
    setIsSaving(false);
    router.push('/patients');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Adicionar Novo Paciente
        </h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
              <CardDescription>Preencha os detalhes do novo paciente.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} disabled={isSaving}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
               <div className="flex justify-end gap-2 w-full">
                  <Button variant="outline" asChild>
                    <Link href="/patients">Cancelar</Link>
                  </Button>
                  <Button type="submit" disabled={isSaving || !selectedUnitId}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Paciente
                  </Button>
                </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

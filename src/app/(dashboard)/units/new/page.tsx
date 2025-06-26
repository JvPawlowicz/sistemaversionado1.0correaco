
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUnit } from '@/contexts/UnitContext';
import { Loader2 } from 'lucide-react';

const unitFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'E-mail inválido.' }).optional().or(z.literal('')),
  responsibleTech: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

export default function NewUnitPage() {
  const [isSaving, setIsSaving] = React.useState(false);
  const { addUnit } = useUnit();
  const router = useRouter();

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(data: UnitFormValues) {
    setIsSaving(true);
    const { addressCity, addressState, addressStreet, addressZip, ...unitData } = data;
    const address = (addressStreet || addressCity || addressState || addressZip) 
      ? { street: addressStreet || '', city: addressCity || '', state: addressState || '', zip: addressZip || '' } 
      : null;

    await addUnit({ ...unitData, address });
    setIsSaving(false);
    router.push('/units');
  }

  return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Adicionar Nova Unidade
        </h1>
      </div>
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
           <Card>
            <CardHeader>
              <CardTitle>Informações da Unidade</CardTitle>
              <CardDescription>Preencha os detalhes da nova unidade. Apenas o nome é obrigatório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome da Unidade</FormLabel>
                        <FormControl><Input placeholder="Ex: Unidade Principal" {...field} disabled={isSaving}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl><Input placeholder="00.000.000/0000-00" {...field} disabled={isSaving}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="responsibleTech" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Responsável Técnico</FormLabel>
                            <FormControl><Input placeholder="Nome do responsável" {...field} disabled={isSaving}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl><Input placeholder="(00) 00000-0000" {...field} disabled={isSaving}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl><Input type="email" placeholder="contato@unidade.com" {...field} disabled={isSaving}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                 <fieldset className="space-y-4 rounded-md border p-4">
                    <legend className="-ml-1 px-1 text-sm font-medium">Endereço</legend>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <FormField control={form.control} name="addressStreet" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logradouro</FormLabel>
                                    <FormControl><Input placeholder="Rua, Av, etc." {...field} disabled={isSaving}/></FormControl>
                                </FormItem>
                            )}/>
                        </div>
                         <div className="sm:col-span-2">
                            <FormField control={form.control} name="addressZip" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CEP</FormLabel>
                                    <FormControl><Input placeholder="00000-000" {...field} disabled={isSaving}/></FormControl>
                                </FormItem>
                            )}/>
                        </div>
                         <div className="sm:col-span-3">
                            <FormField control={form.control} name="addressCity" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl><Input {...field} disabled={isSaving}/></FormControl>
                                </FormItem>
                            )}/>
                        </div>
                        <div className="sm:col-span-3">
                            <FormField control={form.control} name="addressState" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <FormControl><Input placeholder="UF" {...field} disabled={isSaving}/></FormControl>
                                </FormItem>
                            )}/>
                        </div>
                    </div>
                </fieldset>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex w-full justify-end gap-2">
                    <Button variant="outline" asChild type="button">
                        <Link href="/units">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Unidade
                    </Button>
                </div>
            </CardFooter>
           </Card>
        </form>
       </Form>
     </div>
  );
}

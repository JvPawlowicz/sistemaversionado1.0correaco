
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CircleAlert } from 'lucide-react';
import { updateUnitAction } from '@/lib/actions';
import type { Unit } from '@/lib/types';

const unitFormSchema = z.object({
  id: z.string(),
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

const initialState = {
  success: false,
  message: '',
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Alterações
    </Button>
  );
}

export function UnitForm({ unit, onUnitUpdated }: { unit: Unit, onUnitUpdated: () => void }) {
  const [state, formAction] = useActionState(updateUnitAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      onUnitUpdated();
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onUnitUpdated]);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      id: unit.id,
      name: unit.name || '',
      cnpj: unit.cnpj || '',
      phone: unit.phone || '',
      email: unit.email || '',
      responsibleTech: unit.responsibleTech || '',
      addressStreet: unit.address?.street || '',
      addressCity: unit.address?.city || '',
      addressState: unit.address?.state || '',
      addressZip: unit.address?.zip || '',
    },
  });

  return (
    <Form {...form}>
      <form action={formAction} ref={formRef}>
         <Card>
          <CardHeader>
            <CardTitle>Dados Cadastrais da Unidade</CardTitle>
            <CardDescription>Edite as informações detalhadas desta unidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
              )}
              <input type="hidden" name="id" value={unit.id} />
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Nome da Unidade</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="cnpj" render={({ field }) => (
                      <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="responsibleTech" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Responsável Técnico</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
              </div>
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
                  <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
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
                                  <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                          )}/>
                      </div>
                       <div className="sm:col-span-2">
                          <FormField control={form.control} name="addressZip" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>CEP</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                          )}/>
                      </div>
                       <div className="sm:col-span-3">
                          <FormField control={form.control} name="addressCity" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Cidade</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                          )}/>
                      </div>
                      <div className="sm:col-span-3">
                          <FormField control={form.control} name="addressState" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Estado</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                          )}/>
                      </div>
                  </div>
              </fieldset>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
              <SubmitButton />
          </CardFooter>
         </Card>
      </form>
     </Form>
  );
}

'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2, Search, UserPlus, HeartPulse, Link as LinkIcon, Building, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatient } from '@/contexts/PatientContext';
import { useUnit } from '@/contexts/UnitContext';
import type { Patient } from '@/lib/types';
import { searchPatientsGloballyAction, linkPatientToUnitAction, createPatientAction } from '@/lib/actions/patient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDisplayAvatarUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const createInitialState = {
  success: false,
  message: '',
  errors: null,
};

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Paciente
    </Button>
  );
}

export default function NewPatientPage() {
  const [isLinking, setIsLinking] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Patient[]>([]);
  const [view, setView] = React.useState<'search' | 'create'>('search');
  
  const { fetchPatients } = usePatient();
  const { units, selectedUnitId } = useUnit();
  const router = useRouter();
  const { toast } = useToast();
  
  const [createState, createFormAction] = useFormState(createPatientAction, createInitialState);
  const formRef = useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (createState.success) {
      toast({ title: 'Sucesso!', description: createState.message });
      fetchPatients();
      router.push('/patients');
    } else if (createState.message && !createState.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: createState.message });
    }
  }, [createState, toast, fetchPatients, router]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 3) {
      toast({ variant: 'destructive', title: 'Busca inválida', description: 'Digite pelo menos 3 caracteres para buscar.' });
      return;
    }
    setIsSearching(true);
    const results = await searchPatientsGloballyAction(searchTerm);
    setSearchResults(results);
    setIsSearching(false);
  };
  
  const handleLinkPatient = async (patientId: string) => {
    if (!selectedUnitId) return;
    setIsLinking(true);
    const result = await linkPatientToUnitAction(patientId, selectedUnitId);
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      await fetchPatients();
      router.push('/patients');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsLinking(false);
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Adicionar Novo Paciente
        </h1>
      </div>
      
      {view === 'search' ? (
        <Card>
            <CardHeader>
                <CardTitle>Passo 1: Buscar Paciente</CardTitle>
                <CardDescription>Para evitar pacientes duplicados, busque pelo nome ou CPF antes de criar um novo cadastro. Se o paciente já existir em outra unidade, você poderá vinculá-lo à unidade atual.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <Input 
                        placeholder="Buscar por nome ou CPF..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={isSearching}>
                        {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Search className="mr-2" /> Buscar
                    </Button>
                </form>
            </CardContent>
            {isSearching ? (
                 <CardFooter className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></CardFooter>
            ) : searchResults.length > 0 ? (
                <CardFooter className="flex-col items-start gap-4">
                    <h3 className="font-semibold">{searchResults.length} paciente(s) encontrado(s)</h3>
                    <div className="w-full space-y-3">
                        {searchResults.map(patient => {
                            const isLinked = patient.unitIds.includes(selectedUnitId || '');
                            const patientUnits = patient.unitIds.map(uid => units.find(u => u.id === uid)?.name).filter(Boolean);
                            return (
                                <div key={patient.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={getDisplayAvatarUrl(patient.avatarUrl)} alt={patient.name} />
                                            <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{patient.name}</p>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Building className="h-3 w-3"/>
                                                <span>{patientUnits.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleLinkPatient(patient.id)} disabled={isLinked || isLinking}>
                                        {isLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4"/>}
                                        {isLinked ? 'Já Vinculado' : 'Vincular'}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                     <Button variant="outline" className="mt-4" onClick={() => setView('create')}>
                        Nenhum destes? Criar Novo Paciente
                    </Button>
                </CardFooter>
            ) : (
                <CardFooter className="flex-col items-center gap-4 text-center">
                    <HeartPulse className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum paciente encontrado com o termo &quot;{searchTerm}&quot;.</p>
                    <Button onClick={() => setView('create')}>
                        <UserPlus className="mr-2"/>
                        Criar Novo Paciente
                    </Button>
                </CardFooter>
            )}
        </Card>
      ) : (
        <form ref={formRef} action={createFormAction}>
        <Card>
            <CardHeader>
            <CardTitle>Passo 2: Informações do Paciente</CardTitle>
            <CardDescription>Preencha os detalhes do novo paciente. Apenas o nome é obrigatório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createState.message && !createState.success && !createState.errors && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <CircleAlert className="h-4 w-4" />
                      <p>{createState.message}</p>
                  </div>
              )}
              <input type="hidden" name="unitId" value={selectedUnitId || ''} />
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" name="name" defaultValue={searchTerm} required />
                {createState.errors?.name && <p className="text-xs text-destructive mt-1">{createState.errors.name[0]}</p>}
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail (Opcional)</Label>
                  <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
                  {createState.errors?.email && <p className="text-xs text-destructive mt-1">{createState.errors.email[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (Opcional)</Label>
                  <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
                  {createState.errors?.phone && <p className="text-xs text-destructive mt-1">{createState.errors.phone[0]}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Data de Nascimento (Opcional)</Label>
                  <Input id="dob" name="dob" type="date" />
                   {createState.errors?.dob && <p className="text-xs text-destructive mt-1">{createState.errors.dob[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero (Opcional)</Label>
                  <Select name="gender">
                    <SelectTrigger><SelectValue placeholder="Selecione o gênero" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Male">Masculino</SelectItem>
                        <SelectItem value="Female">Feminino</SelectItem>
                        <SelectItem value="Other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {createState.errors?.gender && <p className="text-xs text-destructive mt-1">{createState.errors.gender[0]}</p>}
                </div>
            </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-between gap-2 w-full">
                <Button variant="outline" type="button" onClick={() => setView('search')}>Voltar para Busca</Button>
                <CreateSubmitButton />
                </div>
            </CardFooter>
        </Card>
        </form>
      )}
    </div>
  );
}

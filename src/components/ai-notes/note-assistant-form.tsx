'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePatient } from '@/contexts/PatientContext';
import { useAuth } from '@/contexts/AuthContext';
import { Check, ChevronsUpDown, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiAssistedNoteInput, summarizeAndSaveNotes } from '@/ai/flows/ai-assisted-note-taking';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function NoteAssistantForm() {
    const { patients, loading: patientsLoading } = usePatient();
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedPatientId, setSelectedPatientId] = React.useState('');
    const [sessionNotes, setSessionNotes] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !sessionNotes || !currentUser) {
            toast({
                variant: 'destructive',
                title: 'Campos Incompletos',
                description: 'Por favor, selecione um paciente e adicione as anotações da sessão.',
            });
            return;
        }

        setIsSaving(true);
        const input: AiAssistedNoteInput = {
            patientId: selectedPatientId,
            sessionNotes: sessionNotes,
            authorName: currentUser.name,
        };

        const result = await summarizeAndSaveNotes(input);

        if (result.success) {
            toast({
                title: 'Sucesso!',
                description: result.message,
            });
            router.push(`/patients/${selectedPatientId}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Erro da IA',
                description: result.message,
            });
        }
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 space-y-2">
                            <Label htmlFor="patient">Paciente</Label>
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isPopoverOpen}
                                    className="w-full justify-between"
                                    disabled={patientsLoading}
                                >
                                    {selectedPatient ? selectedPatient.name : "Selecione um paciente..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar paciente..." />
                                    <CommandList>
                                    <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {patients.map((patient) => (
                                        <CommandItem
                                            key={patient.id}
                                            value={patient.name}
                                            onSelect={() => {
                                                setSelectedPatientId(patient.id);
                                                setIsPopoverOpen(false);
                                            }}
                                        >
                                            <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                selectedPatientId === patient.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                            />
                                            {patient.name}
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="session-notes">Anotações da Sessão</Label>
                        <Textarea
                            id="session-notes"
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            placeholder="Descreva aqui os detalhes da sessão. Inclua observações subjetivas do paciente, dados objetivos, sua avaliação e o plano para as próximas sessões..."
                            rows={15}
                            disabled={isSaving}
                        />
                         <p className="text-xs text-muted-foreground">
                            Quanto mais detalhes você fornecer, melhor será o resumo estruturado pela IA.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving || !selectedPatientId || sessionNotes.length < 10}>
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Gerar e Salvar Registro
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

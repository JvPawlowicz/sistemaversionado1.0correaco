'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { summarizeNotes, type SoapNoteOutput } from '@/ai/flows/ai-assisted-note-taking';
import { Bot, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AiNotesPage() {
  const [rawNotes, setRawNotes] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<SoapNoteOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSummarize = async () => {
    if (!rawNotes.trim()) return;
    setIsLoading(true);
    setSummary(null);
    setError(null);
    try {
      const result = await summarizeNotes({ rawNotes });
      setSummary(result);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao gerar o resumo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Anotações com Assistente IA</h1>
        <p className="text-muted-foreground">
          Cole suas anotações brutas da sessão e a IA irá estruturá-las no formato SOAP.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anotações Brutas</CardTitle>
            <CardDescription>Insira as anotações da sessão aqui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Ex: Paciente relatou melhora na comunicação em casa. Conseguiu completar a tarefa de apontar para 3 objetos com 80% de acerto em 10 tentativas..."
              rows={15}
              className="resize-none"
            />
            <Button onClick={handleSummarize} disabled={isLoading || !rawNotes.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              Gerar Resumo SOAP
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Estruturado (SOAP)</CardTitle>
            <CardDescription>Resumo gerado pela IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
                <div className="text-destructive">{error}</div>
            ) : summary ? (
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-primary">Subjetivo (S)</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{summary.subjective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Objetivo (O)</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{summary.objective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Avaliação (A)</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{summary.assessment}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Plano (P)</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{summary.plan}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
                <p>O resumo estruturado aparecerá aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

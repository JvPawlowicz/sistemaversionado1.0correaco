'use client';

import * as React from 'react';
import { Loader2, Sparkles, FileText, ListTree, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { processNote, NoteInput, NoteOutput } from '@/ai/flows/ai-assisted-note-taking';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function NoteAssistantForm() {
  const [note, setNote] = React.useState('');
  const [result, setResult] = React.useState<NoteOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleProcessNote = async (action: NoteInput['action']) => {
    if (!note.trim()) {
      setError('Por favor, insira o texto da anotação antes de processar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await processNote({ note, action });
      setResult(response);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao processar a anotação com a IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.result) {
      navigator.clipboard.writeText(result.result);
      toast({
        title: "Copiado!",
        description: "O resultado foi copiado para a área de transferência.",
      });
    }
  };


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sua Anotação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Cole ou digite aqui as anotações da sua sessão..."
            className="min-h-[300px] text-base"
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              if(error) setError(null)
            }}
          />
          {error && (
             <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleProcessNote('summarize')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Sparkles className="mr-2" /> Resumir
            </Button>
            <Button onClick={() => handleProcessNote('keywords')} disabled={isLoading} variant="secondary">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2" /> Extrair Palavras-Chave
            </Button>
            <Button onClick={() => handleProcessNote('plan')} disabled={isLoading} variant="secondary">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ListTree className="mr-2" /> Criar Plano de Ação
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resultado da IA</CardTitle>
           {result && (
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              <Clipboard className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Processando...</p>
            </div>
          ) : result ? (
             <div className="prose prose-sm dark:prose-invert max-w-none w-full whitespace-pre-wrap rounded-md bg-secondary/50 p-4 h-full overflow-y-auto">
               {result.result}
             </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Sparkles className="mx-auto h-12 w-12" />
              <p className="mt-2">O resultado gerado pela IA aparecerá aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

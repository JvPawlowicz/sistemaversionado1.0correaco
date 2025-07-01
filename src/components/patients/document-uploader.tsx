'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadDocumentAction } from '@/lib/actions/patient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface DocumentUploaderProps {
  patientId: string;
  onDocumentAdded: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Salvar Documento
        </>
      )}
    </Button>
  );
}

export function DocumentUploader({ patientId, onDocumentAdded }: DocumentUploaderProps) {
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState<'Exame' | 'Documento Legal' | 'Foto Terapêutica' | 'Outro'>('Outro');
  const [description, setDescription] = React.useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "O tamanho máximo do arquivo é 10MB.",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFormAction = async (formData: FormData) => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo selecionado",
        description: "Por favor, escolha um arquivo para enviar.",
      });
      return;
    }
    
    formData.append('category', category);
    formData.append('description', description);

    const result = await uploadDocumentAction(patientId, formData);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
      });
      onDocumentAdded();
      formRef.current?.reset();
      setSelectedFile(null);
      setCategory('Outro');
      setDescription('');
    } else {
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: result.message,
      });
    }
  };

  return (
    <form ref={formRef} action={handleFormAction} className="mt-4 rounded-lg border bg-card p-4 shadow-sm space-y-4">
        <div className="space-y-2">
            <Label>Novo Documento</Label>
            <Input
                id="documentFile"
                name="documentFile"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
             <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                {selectedFile ? 'Trocar Arquivo' : 'Escolher Arquivo'}
            </Button>
             {selectedFile && (
                <p className="text-sm text-muted-foreground pt-2">
                    Arquivo selecionado: <span className="font-semibold text-foreground">{selectedFile.name}</span>
                </p>
            )}
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as any)}>
                <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Exame">Exame</SelectItem>
                    <SelectItem value="Documento Legal">Documento Legal</SelectItem>
                    <SelectItem value="Foto Terapêutica">Foto Terapêutica</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
            </Select>
        </div>

         <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do arquivo..." />
        </div>
        
        <SubmitButton />
    </form>
  );
}

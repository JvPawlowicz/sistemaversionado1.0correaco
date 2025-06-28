'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CircleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createEvolutionRecordAction } from '@/lib/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewEvolutionRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patientId: string;
  onRecordAdded: () => void;
}

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
      Salvar Registro
    </Button>
  );
}

export function NewEvolutionRecordDialog({ isOpen, onOpenChange, patientId, onRecordAdded }: NewEvolutionRecordDialogProps) {
  const [state, formAction] = useActionState(createEvolutionRecordAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { currentUser } = useAuth();
  const { templates } = useTemplate();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      onRecordAdded();
      handleClose();
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onRecordAdded, onOpenChange]);

  const handleClose = () => {
    formRef.current?.reset();
    setTitle('');
    setDetails('');
    onOpenChange(false);
  };
  
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setDetails(selectedTemplate.content);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Novo Registro de Evolução</DialogTitle>
            <DialogDescription>
              Adicione um novo registro para o prontuário do paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="patientId" value={patientId} />
            <input type="hidden" name="author" value={currentUser?.name || 'Sistema'} />

             <div className="space-y-2">
                <Label htmlFor="template">Usar Modelo (Opcional)</Label>
                <Select onValueChange={handleTemplateSelect} disabled={templates.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                    <SelectContent>
                        {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Título do Registro</Label>
              <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              {state.errors?.title && <p className="text-xs text-destructive mt-1">{state.errors.title[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Detalhes</Label>
              <Textarea id="details" name="details" value={details} onChange={(e) => setDetails(e.target.value)} required rows={8} />
              {state.errors?.details && <p className="text-xs text-destructive mt-1">{state.errors.details[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

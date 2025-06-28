'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CircleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { createEvolutionTemplateAction, updateEvolutionTemplateAction } from '@/lib/actions';
import type { EvolutionTemplate } from '@/lib/types';

interface TemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  template?: EvolutionTemplate | null;
}

const initialState = { success: false, message: '', errors: null };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? 'Salvar Alterações' : 'Criar Modelo'}
    </Button>
  );
}

export function TemplateDialog({ isOpen, onOpenChange, template }: TemplateDialogProps) {
  const isEditing = !!template;
  const action = isEditing ? updateEvolutionTemplateAction : createEvolutionTemplateAction;
  const [state, formAction] = React.useActionState(action, initialState);

  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { currentUser } = useAuth();
  const { fetchTemplates } = useTemplate();

  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchTemplates();
      onOpenChange(false);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, fetchTemplates, onOpenChange]);

  const handleClose = () => {
    formRef.current?.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Modelo' : 'Novo Modelo de Evolução'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Altere o título e o conteúdo deste modelo.' : 'Crie um modelo para agilizar seus registros de evolução.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="userId" value={currentUser?.id || ''} />
            {isEditing && <input type="hidden" name="templateId" value={template.id} />}
            <div className="space-y-2">
              <Label htmlFor="title">Título do Modelo</Label>
              <Input id="title" name="title" defaultValue={template?.title || ''} required />
              {state.errors?.title && <p className="text-xs text-destructive mt-1">{state.errors.title[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo do Modelo</Label>
              <Textarea id="content" name="content" defaultValue={template?.content || ''} required rows={10} placeholder="Escreva o conteúdo base para sua evolução aqui..." />
              {state.errors?.content && <p className="text-xs text-destructive mt-1">{state.errors.content[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

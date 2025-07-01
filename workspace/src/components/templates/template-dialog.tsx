'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CircleAlert, PlusCircle, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { createEvolutionTemplateAction, updateEvolutionTemplateAction } from '@/lib/actions/template';
import type { EvolutionTemplate, TemplateField } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useImmer } from 'use-immer';

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
  
  const [title, setTitle] = React.useState('');
  const [fields, setFields] = useImmer<TemplateField[]>([]);

  React.useEffect(() => {
    if (template) {
        setTitle(template.title);
        // Handle both old string content and new array content
        if(Array.isArray(template.content)) {
            setFields(template.content);
        } else {
            // Convert old string template to new format
            setFields([{ id: crypto.randomUUID(), type: 'textarea', label: 'Conteúdo', placeholder: '' }]);
        }
    } else {
        setTitle('');
        setFields([]);
    }
  }, [template, setFields]);


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
  
  const addField = (type: TemplateField['type']) => {
    setFields(draft => {
        draft.push({
            id: crypto.randomUUID(),
            type,
            label: '',
            options: type === 'checkbox' || type === 'radio' ? [''] : undefined,
            placeholder: type === 'text' || type === 'textarea' ? '' : undefined,
        })
    })
  }
  
  const updateField = (index: number, key: keyof TemplateField, value: any) => {
    setFields(draft => {
        (draft[index] as any)[key] = value;
    });
  };

  const removeField = (index: number) => {
    setFields(draft => {
        draft.splice(index, 1);
    });
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields(draft => {
        const item = draft[index];
        if (direction === 'up' && index > 0) {
            draft.splice(index, 1);
            draft.splice(index - 1, 0, item);
        } else if (direction === 'down' && index < draft.length - 1) {
            draft.splice(index, 1);
            draft.splice(index + 1, 0, item);
        }
    });
  };
  
  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setFields(draft => {
        if(draft[fieldIndex].options) {
            draft[fieldIndex].options![optionIndex] = value;
        }
    })
  }

  const addOption = (fieldIndex: number) => {
    setFields(draft => {
         if(draft[fieldIndex].options) {
            draft[fieldIndex].options!.push('');
         }
    });
  }
  
  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFields(draft => {
        if(draft[fieldIndex].options && draft[fieldIndex].options!.length > 1) {
            draft[fieldIndex].options!.splice(optionIndex, 1);
        }
    });
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Modelo' : 'Novo Modelo de Evolução'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Altere a estrutura deste modelo.' : 'Crie um modelo estruturado para agilizar seus registros.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="userId" value={currentUser?.id || ''} />
            {isEditing && <input type="hidden" name="templateId" value={template.id} />}
            <input type="hidden" name="content" value={JSON.stringify(fields)} />
            
            <div className="space-y-2">
              <Label htmlFor="title">Título do Modelo</Label>
              <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              {state.errors?.title && <p className="text-xs text-destructive mt-1">{state.errors.title[0]}</p>}
            </div>

            <div className="space-y-4">
                <Label>Estrutura do Formulário</Label>
                <div className="space-y-3 rounded-lg border p-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 rounded-md border p-3 bg-secondary/50">
                        <div className="flex flex-col gap-1.5 pt-1">
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Select value={field.type} onValueChange={(value) => updateField(index, 'type', value)}>
                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="header">Cabeçalho</SelectItem>
                                        <SelectItem value="text">Texto Curto</SelectItem>
                                        <SelectItem value="textarea">Texto Longo</SelectItem>
                                        <SelectItem value="checkbox">Caixas de Seleção</SelectItem>
                                        <SelectItem value="radio">Múltipla Escolha</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Rótulo do campo" value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} />
                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeField(index)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            {(field.type === 'checkbox' || field.type === 'radio') && (
                                <div className="pl-4 space-y-2">
                                    {field.options?.map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                            <Input placeholder={`Opção ${optIndex + 1}`} value={option} onChange={(e) => updateOption(index, optIndex, e.target.value)} />
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeOption(index, optIndex)} disabled={field.options!.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => addOption(index)}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção</Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Comece adicionando um campo ao seu modelo.</p>}
                </div>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => addField('header')}>Add Cabeçalho</Button>
                    <Button type="button" variant="outline" onClick={() => addField('textarea')}>Add Texto Longo</Button>
                    <Button type="button" variant="outline" onClick={() => addField('checkbox')}>Add Checkbox</Button>
                    <Button type="button" variant="outline" onClick={() => addField('radio')}>Add Alternativas</Button>
                </div>
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

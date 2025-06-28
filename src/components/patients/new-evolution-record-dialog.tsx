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
import type { TemplateField } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

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

const formatDetailsString = (values: Record<string, any>, fields: TemplateField[]): string => {
  return fields
    .map(field => {
      const value = values[field.id];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        return null; 
      }

      if (field.type === 'header') {
        return `\n## ${field.label}\n`;
      }

      let formattedValue: string;
      if (Array.isArray(value)) {
        formattedValue = value.join(', ');
      } else {
        formattedValue = String(value);
      }
      
      return `**${field.label}:** ${formattedValue}`;
    })
    .filter(Boolean)
    .join('\n');
};

export function NewEvolutionRecordDialog({ isOpen, onOpenChange, patientId, onRecordAdded }: NewEvolutionRecordDialogProps) {
  const [state, formAction] = useActionState(createEvolutionRecordAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { currentUser } = useAuth();
  const { templates } = useTemplate();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [currentTemplateFields, setCurrentTemplateFields] = useState<TemplateField[] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      onRecordAdded();
      handleClose();
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, onRecordAdded]);

  useEffect(() => {
    if (currentTemplateFields) {
        const newDetails = formatDetailsString(formValues, currentTemplateFields);
        setDetails(newDetails);
    }
  }, [formValues, currentTemplateFields]);

  const handleClose = () => {
    formRef.current?.reset();
    setTitle('');
    setDetails('');
    setCurrentTemplateFields(null);
    setFormValues({});
    onOpenChange(false);
  };
  
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setCurrentTemplateFields(null); 
      setFormValues({});
      if (Array.isArray(selectedTemplate.content)) {
        setCurrentTemplateFields(selectedTemplate.content);
        setDetails('');
      } else {
        setDetails(selectedTemplate.content as string);
      }
    }
  };

  const handleFormValueChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({...prev, [fieldId]: value}));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setFormValues(prev => {
        const currentValues: string[] = prev[fieldId] || [];
        if (checked) {
            return { ...prev, [fieldId]: [...currentValues, option] };
        } else {
            return { ...prev, [fieldId]: currentValues.filter(v => v !== option) };
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Novo Registro de Evolução</DialogTitle>
            <DialogDescription>
              Adicione um novo registro para o prontuário do paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <input type="hidden" name="patientId" value={patientId} />
            <input type="hidden" name="author" value={currentUser?.name || 'Sistema'} />
            <input type="hidden" name="details" value={details} />

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
            
            {currentTemplateFields ? (
                <div className="space-y-4">
                    {currentTemplateFields.map(field => {
                        switch (field.type) {
                            case 'header':
                                return <h3 key={field.id} className="text-lg font-semibold border-b pb-1 mt-4">{field.label}</h3>;
                            case 'text':
                                return (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.id}>{field.label}</Label>
                                        <Input id={field.id} placeholder={field.placeholder} value={formValues[field.id] || ''} onChange={e => handleFormValueChange(field.id, e.target.value)} />
                                    </div>
                                );
                            case 'textarea':
                                return (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.id}>{field.label}</Label>
                                        <Textarea id={field.id} placeholder={field.placeholder} value={formValues[field.id] || ''} onChange={e => handleFormValueChange(field.id, e.target.value)} />
                                    </div>
                                );
                            case 'radio':
                                return (
                                    <div key={field.id} className="space-y-2">
                                        <Label>{field.label}</Label>
                                        <RadioGroup onValueChange={value => handleFormValueChange(field.id, value)} value={formValues[field.id]}>
                                            {(field.options || []).map(option => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                                                    <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                );
                            case 'checkbox':
                                return (
                                    <div key={field.id} className="space-y-2">
                                        <Label>{field.label}</Label>
                                        {(field.options || []).map(option => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <Checkbox id={`${field.id}-${option}`} onCheckedChange={checked => handleCheckboxChange(field.id, option, !!checked)} checked={(formValues[field.id] || []).includes(option)} />
                                                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="details">Detalhes</Label>
                    <Textarea id="details-visible" value={details} onChange={(e) => setDetails(e.target.value)} required rows={10} />
                    {state.errors?.details && <p className="text-xs text-destructive mt-1">{state.errors.details[0]}</p>}
                </div>
            )}

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

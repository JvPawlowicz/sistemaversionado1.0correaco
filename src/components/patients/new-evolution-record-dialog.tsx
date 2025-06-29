
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CircleAlert, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createEvolutionRecordAction } from '@/lib/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TemplateField, Patient, TreatmentObjective, ObjectiveProgressData } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { useImmer } from 'use-immer';
import { cn } from '@/lib/utils';


interface NewEvolutionRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patient: Patient;
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

export function NewEvolutionRecordDialog({ isOpen, onOpenChange, patient, onRecordAdded }: NewEvolutionRecordDialogProps) {
  const [state, formAction] = useActionState(createEvolutionRecordAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { currentUser } = useAuth();
  const { templates } = useTemplate();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [currentTemplateFields, setCurrentTemplateFields] = useState<TemplateField[] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [linkedObjectiveIds, setLinkedObjectiveIds] = useState<string[]>([]);
  const [objectiveProgress, setObjectiveProgress] = useImmer<Record<string, Partial<ObjectiveProgressData>>>({});
  
  const allObjectives = patient.treatmentPlan?.goals.flatMap(g => g.objectives) || [];

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
    setLinkedObjectiveIds([]);
    setObjectiveProgress({});
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

  const handleObjectiveLink = (objective: TreatmentObjective, checked: boolean) => {
    if (checked) {
        setLinkedObjectiveIds(prev => [...prev, objective.id]);
        setObjectiveProgress(draft => {
            draft[objective.id] = { type: objective.dataCollectionType };
        });
    } else {
        setLinkedObjectiveIds(prev => prev.filter(id => id !== objective.id));
        setObjectiveProgress(draft => {
            delete draft[objective.id];
        });
    }
  };

  const handleProgressDataChange = (objectiveId: string, field: 'value' | 'total', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    setObjectiveProgress(draft => {
        if(draft[objectiveId]){
           (draft[objectiveId] as any)[field] = numValue;
        }
    });
  }

  const stringifiedProgress = JSON.stringify(objectiveProgress);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl grid-rows-[auto_1fr_auto] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Novo Registro de Evolução</DialogTitle>
          <DialogDescription>
            Adicione um novo registro para o prontuário de {patient.name}.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="grid md:grid-cols-2 gap-6 overflow-hidden h-full">
            <div className="space-y-4 py-4 max-h-full overflow-y-auto pr-4 flex flex-col">
              {state.message && !state.success && !state.errors && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <CircleAlert className="h-4 w-4" />
                      <p>{state.message}</p>
                  </div>
              )}
              <input type="hidden" name="patientId" value={patient.id} />
              <input type="hidden" name="author" value={currentUser?.name || 'Sistema'} />
              <input type="hidden" name="details" value={details} />
              {linkedObjectiveIds.map(id => <input key={id} type="hidden" name="linkedObjectiveIds" value={id} />)}
               <input type="hidden" name="objectiveProgress" value={stringifiedProgress} />

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
              
              <div className="flex-grow flex flex-col min-h-0">
              {currentTemplateFields ? (
                  <div className="space-y-4 flex-grow overflow-y-auto pr-2">
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
                                                      <RadioGroupItem value={option} id={`${field.id}-${option}`} /><Label htmlFor={`${field.id}-${option}`}>{option}</Label>
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
                  <div className="space-y-2 flex-grow flex flex-col">
                      <Label htmlFor="details-visible">Detalhes</Label>
                      <Textarea id="details-visible" value={details} onChange={(e) => setDetails(e.target.value)} required className="flex-grow" />
                      {state.errors?.details && <p className="text-xs text-destructive mt-1">{state.errors.details[0]}</p>}
                  </div>
              )}
              </div>
            </div>
            <div className="space-y-4 py-4 max-h-full overflow-y-auto pr-4 border-l pl-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-base font-semibold"><Target /> Vincular e Registrar Progresso de Objetivos</Label>
                    <p className="text-sm text-muted-foreground">Selecione os objetivos trabalhados e insira os dados coletados na sessão.</p>
                </div>
                 <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                        {allObjectives.length > 0 ? (
                            allObjectives.map(objective => (
                                <div key={objective.id}>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`link-${objective.id}`}
                                            onCheckedChange={(checked) => handleObjectiveLink(objective, !!checked)}
                                            checked={linkedObjectiveIds.includes(objective.id)}
                                        />
                                        <Label htmlFor={`link-${objective.id}`} className="font-normal flex-1">{objective.description}</Label>
                                    </div>
                                    {linkedObjectiveIds.includes(objective.id) && (
                                        <fieldset className="mt-2 ml-6 pl-4 border-l-2 space-y-2">
                                            <legend className="text-xs font-semibold text-muted-foreground">Coleta de Dados ({objective.dataCollectionType})</legend>
                                            {objective.dataCollectionType === 'Tentativas' ? (
                                                <div className="flex items-center gap-2">
                                                    <Input type="number" placeholder="Acertos" onChange={e => handleProgressDataChange(objective.id, 'value', e.target.value)} />
                                                    <span className="text-muted-foreground">/</span>
                                                    <Input type="number" placeholder="Total" onChange={e => handleProgressDataChange(objective.id, 'total', e.target.value)} />
                                                </div>
                                            ) : (
                                                 <Input type="number" placeholder={
                                                    objective.dataCollectionType === 'Frequência' ? 'Contagem' :
                                                    objective.dataCollectionType === 'Duração' ? 'Minutos' : 'Valor'
                                                 } onChange={e => handleProgressDataChange(objective.id, 'value', e.target.value)} />
                                            )}
                                        </fieldset>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">Nenhum Plano Terapêutico Individual (PTI) definido para este paciente.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
             <DialogFooter className="md:col-span-2">
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

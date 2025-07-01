'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CircleAlert, ArrowLeft, ArrowRight, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePatient } from '@/contexts/PatientContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { createAssessmentAction } from '@/lib/actions/assessment';
import type { EvolutionTemplate, Patient, TemplateField } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useUnit } from '@/contexts/UnitContext';

interface NewAssessmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const initialState = { success: false, message: '', errors: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Avaliação
    </Button>
  );
}

export function NewAssessmentDialog({ isOpen, onOpenChange }: NewAssessmentDialogProps) {
  const [state, formAction] = React.useActionState(createAssessmentAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const { currentUser } = useAuth();
  const { patients, fetchPatients } = usePatient();
  const { templates } = useTemplate();
  const { selectedUnitId } = useUnit();
  
  const [step, setStep] = React.useState(1);
  const [patientSelectionType, setPatientSelectionType] = React.useState<'existing' | 'new'>('existing');
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [newPatientName, setNewPatientName] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<EvolutionTemplate | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  
  const assessmentTemplates = templates.filter(t => Array.isArray(t.content));

  const resetState = () => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedTemplate(null);
    setFormValues({});
    setPatientSelectionType('existing');
    setNewPatientName('');
    formRef.current?.reset();
  };

  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchPatients();
      onOpenChange(false);
      resetState();
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, onOpenChange, toast, fetchPatients]);

  const handleFormValueChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <RadioGroup value={patientSelectionType} onValueChange={(v) => {setPatientSelectionType(v as any); setSelectedPatient(null); setNewPatientName('');}} className="grid grid-cols-2 gap-4">
                <Label htmlFor="type-existing" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value="existing" id="type-existing" className="sr-only peer" />
                    <User className="mb-3 h-6 w-6" />
                    Paciente Existente
                </Label>
                 <Label htmlFor="type-new" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value="new" id="type-new" className="sr-only peer" />
                    <User className="mb-3 h-6 w-6" />
                    Novo Paciente (Triagem)
                </Label>
            </RadioGroup>
            {patientSelectionType === 'existing' ? (
                <div className="space-y-2 pt-4">
                    <Label htmlFor="patient-select">Selecione o Paciente</Label>
                    <Select onValueChange={(id) => setSelectedPatient(patients.find(p => p.id === id) || null)}>
                    <SelectTrigger id="patient-select"><SelectValue placeholder="Escolha um paciente..." /></SelectTrigger>
                    <SelectContent>
                        {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="space-y-2 pt-4">
                    <Label htmlFor="new-patient-name">Nome do Novo Paciente</Label>
                    <Input id="new-patient-name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Digite o nome completo" />
                </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="template-select">Selecione o Modelo de Avaliação</Label>
            <Select onValueChange={(id) => setSelectedTemplate(templates.find(t => t.id === id) || null)}>
              <SelectTrigger id="template-select"><SelectValue placeholder="Escolha um modelo..." /></SelectTrigger>
              <SelectContent>
                {assessmentTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        );
      case 3:
        const fields = selectedTemplate?.content as TemplateField[];
        return (
          <div className="space-y-4">
            {fields.map(field => {
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
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1) {
        if (patientSelectionType === 'existing' && !selectedPatient) return true;
        if (patientSelectionType === 'new' && newPatientName.trim().length < 3) return true;
    }
    if (step === 2 && !selectedTemplate) return true;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetState(); onOpenChange(open); }}>
      <DialogContent className="max-w-2xl">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Nova Avaliação/Anamnese</DialogTitle>
            <DialogDescription>Siga os passos para registrar uma nova avaliação para um paciente.</DialogDescription>
            <Progress value={(step / 3) * 100} className="mt-2" />
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
            {state.message && !state.success && !state.errors && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2"><CircleAlert className="h-4 w-4" />{state.message}</div>}
             {state.errors?.patientId && <p className="text-xs text-destructive mt-1">{state.errors.patientId[0]}</p>}
             {state.errors?.newPatientName && <p className="text-xs text-destructive mt-1">{state.errors.newPatientName[0]}</p>}

            {/* Hidden fields for submission */}
            {step === 3 && (
              <>
                <input type="hidden" name="patientSelectionType" value={patientSelectionType} />
                {patientSelectionType === 'existing' ? (
                    <input type="hidden" name="patientId" value={selectedPatient?.id} />
                ) : (
                    <input type="hidden" name="newPatientName" value={newPatientName} />
                )}
                <input type="hidden" name="unitId" value={selectedUnitId || ''} />
                <input type="hidden" name="templateId" value={selectedTemplate?.id} />
                <input type="hidden" name="templateTitle" value={selectedTemplate?.title} />
                <input type="hidden" name="answers" value={JSON.stringify(formValues)} />
                <input type="hidden" name="authorId" value={currentUser?.id} />
                <input type="hidden" name="authorName" value={currentUser?.name} />
              </>
            )}

            {renderStepContent()}
          </div>
          <DialogFooter className="justify-between">
            <div>
              {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}><ArrowLeft className="mr-2" />Voltar</Button>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); resetState(); }}>Cancelar</Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep(s => s + 1)} disabled={isNextDisabled()}>Avançar<ArrowRight className="ml-2" /></Button>
              ) : (
                <SubmitButton />
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

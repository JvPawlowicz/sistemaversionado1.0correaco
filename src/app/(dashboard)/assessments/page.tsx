'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { NewAssessmentDialog } from '@/components/assessments/new-assessment-dialog';
import { AssessmentTable } from '@/components/assessments/assessment-table';

export default function AssessmentsPage() {
  const { assessments, loading, error } = useAssessment();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <NewAssessmentDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Anamneses e Avaliações
          </h1>
          <p className="text-muted-foreground">
            Crie, visualize e gerencie as avaliações e anamneses dos pacientes.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>
      
      <AssessmentTable assessments={assessments} loading={loading} error={error} />
    </div>
  );
}

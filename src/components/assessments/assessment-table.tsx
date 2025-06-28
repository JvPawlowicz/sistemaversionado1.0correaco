'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileSearch, Loader2, Terminal } from 'lucide-react';
import type { Assessment } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Card } from '../ui/card';

interface AssessmentTableProps {
  assessments: Assessment[];
  loading: boolean;
  error: string | null;
}

export function AssessmentTable({ assessments, loading, error }: AssessmentTableProps) {
  if (loading) {
    return <Card className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></Card>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Avaliações</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-8 text-center">
        <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Nenhuma avaliação encontrada</h3>
        <p className="text-muted-foreground">Comece criando uma nova avaliação.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Avaliação</TableHead>
            <TableHead className="hidden md:table-cell">Profissional</TableHead>
            <TableHead><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.map((assessment) => (
            <TableRow key={assessment.id}>
              <TableCell>{assessment.createdAt ? format(assessment.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
              <TableCell className="font-medium">{assessment.patientName}</TableCell>
              <TableCell>{assessment.templateTitle}</TableCell>
              <TableCell className="hidden md:table-cell">{assessment.authorName}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" disabled>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Visualizar</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

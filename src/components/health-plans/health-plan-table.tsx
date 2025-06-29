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
import { MoreHorizontal, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HealthPlanWithUnit } from '@/lib/types';
import { EditHealthPlanDialog } from './edit-health-plan-dialog';
import { DeleteHealthPlanDialog } from './delete-health-plan-dialog';

interface HealthPlanTableProps {
  healthPlans: HealthPlanWithUnit[];
  onPlanChanged: () => void;
}

export function HealthPlanTable({ healthPlans, onPlanChanged }: HealthPlanTableProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<HealthPlanWithUnit | null>(null);

  const handleEdit = (plan: HealthPlanWithUnit) => {
    setSelectedPlan(plan);
    setIsEditOpen(true);
  };

  const handleDelete = (plan: HealthPlanWithUnit) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  if (healthPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-8 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Nenhum plano de saúde encontrado</h3>
        <p className="text-muted-foreground">
          Comece cadastrando o primeiro plano de saúde para uma unidade.
        </p>
      </div>
    );
  }

  return (
    <>
      <EditHealthPlanDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        plan={selectedPlan}
        onPlanChanged={onPlanChanged}
      />
      <DeleteHealthPlanDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        plan={selectedPlan}
        onPlanChanged={onPlanChanged}
      />
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Plano</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthPlans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div className="flex items-center gap-3 font-medium">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: plan.color }}
                    />
                    {plan.name}
                  </div>
                </TableCell>
                <TableCell>{plan.unitName}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(plan)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(plan)}
                        className="text-destructive"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

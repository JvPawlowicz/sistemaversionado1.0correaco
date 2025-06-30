'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import type { Patient } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PatientSearchComboBoxProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string | null) => void;
  loading: boolean;
  placeholder?: string;
}

export function PatientSearchComboBox({ patients, selectedPatientId, onSelectPatient, loading, placeholder = "Selecione um paciente..." }: PatientSearchComboBoxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            selectedPatient ? selectedPatient.name : placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar paciente..." />
          <CommandList>
            <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.name}
                  onSelect={() => {
                    onSelectPatient(patient.id === selectedPatientId ? null : patient.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedPatientId === patient.id ? 'opacity-100' : 'opacity-0')} />
                  {patient.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

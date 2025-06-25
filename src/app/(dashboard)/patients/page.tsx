import Link from 'next/link';
import { PatientTable } from '@/components/patients/patient-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { patients } from '@/lib/placeholder-data';

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Pacientes
        </h1>
        <Button asChild>
          <Link href="/patients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Novo Paciente
          </Link>
        </Button>
      </div>
      <PatientTable patients={patients} />
    </div>
  );
}

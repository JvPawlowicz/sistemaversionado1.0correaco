import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, PlusCircle } from 'lucide-react';
import type { Patient } from '@/lib/types';

export function PatientTable({ patients, searchTerm }: { patients: Patient[], searchTerm: string }) {
  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Nenhum paciente encontrado</h3>
        <p className="text-muted-foreground mb-4">
            {searchTerm 
                ? "Tente refinar sua busca ou adicione um novo paciente."
                : "Comece adicionando um novo paciente ao sistema."
            }
        </p>
        <Button asChild>
          <Link href="/patients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Novo Paciente
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Última Visita</TableHead>
            <TableHead className="hidden lg:table-cell">Contato</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={patient.avatarUrl} alt={patient.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={patient.status === 'Active' ? 'secondary' : 'outline'}>
                  {patient.status === 'Active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{patient.lastVisit}</TableCell>
              <TableCell className="hidden lg:table-cell">{patient.email}</TableCell>
              <TableCell>
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/patients/${patient.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Paciente</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

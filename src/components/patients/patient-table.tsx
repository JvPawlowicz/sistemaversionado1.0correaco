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
import { Eye } from 'lucide-react';
import type { Patient } from '@/lib/types';

export function PatientTable({ patients }: { patients: Patient[] }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last Visit</TableHead>
            <TableHead className="hidden lg:table-cell">Contact</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={patient.avatarUrl} alt={patient.name} />
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
                  {patient.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{patient.lastVisit}</TableCell>
              <TableCell className="hidden lg:table-cell">{patient.email}</TableCell>
              <TableCell>
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/patients/${patient.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Patient</span>
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

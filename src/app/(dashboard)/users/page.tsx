'use client';

import * as React from 'react';
import { UserTable } from '@/components/users/user-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Terminal } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NewUserDialog } from '@/components/users/new-user-dialog';

export default function UsersPage() {
  const { users, loading, error } = useUser();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <NewUserDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Usuários
        </h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo Usuário
        </Button>
      </div>
      {loading ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      ) : (
        <UserTable users={users} onAddUser={() => setIsDialogOpen(true)} />
      )}
    </div>
  );
}

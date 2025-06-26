'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserTable } from '@/components/users/user-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Terminal, ShieldAlert } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NewUserDialog } from '@/components/users/new-user-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UsersPage() {
  const { users, loading: usersLoading, error, fetchUsers } = useUser();
  const { currentUser, loading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [authLoading, currentUser, router]);
  
  const loading = usersLoading || authLoading;

  if (loading) {
     return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
  }

  if (!currentUser || currentUser.role !== 'Admin') {
    return (
       <Card className="mt-8">
        <CardHeader className="items-center text-center">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">Voltar para o Painel</Button>
        </CardContent>
       </Card>
    )
  }

  return (
    <div className="space-y-6">
      <NewUserDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onUserAdded={fetchUsers} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Usuários
        </h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo Usuário
        </Button>
      </div>
      {error ? (
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

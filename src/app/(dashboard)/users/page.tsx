import { UserTable } from '@/components/users/user-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { users } from '@/lib/placeholder-data';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestão de Usuários
        </h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo Usuário
        </Button>
      </div>
      <UserTable users={users} />
    </div>
  );
}

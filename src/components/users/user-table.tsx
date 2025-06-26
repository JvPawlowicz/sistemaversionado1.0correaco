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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/types';
import { ResetPasswordDialog } from './reset-password-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { useUnit } from '@/contexts/UnitContext';

interface UserTableProps {
  users: User[];
  onAddUser: () => void;
}

const roleNames: Record<User['role'], string> = {
  Admin: 'Admin',
  Therapist: 'Terapeuta',
  Receptionist: 'Recepcionista',
  Coordinator: 'Coordenador',
};

export function UserTable({ users, onAddUser }: UserTableProps) {
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const { units } = useUnit();

  const handleResetPasswordClick = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Nenhum usuário encontrado</h3>
        <p className="text-muted-foreground mb-4">Comece adicionando um novo usuário ao sistema.</p>
        <Button onClick={onAddUser}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo Usuário
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <ResetPasswordDialog 
        isOpen={isResetPasswordOpen} 
        onOpenChange={setIsResetPasswordOpen}
        user={selectedUser} 
      />
      <DeleteUserDialog
        isOpen={isDeleteUserOpen}
        onOpenChange={setIsDeleteUserOpen}
        user={selectedUser}
      />
      <EditUserDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
      />
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="hidden lg:table-cell">Unidades</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{roleNames[user.role] || user.role}</TableCell>
                <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                        {(user.unitIds || []).map(unitId => {
                            const unit = units.find(u => u.id === unitId);
                            return unit ? <Badge key={unitId} variant="secondary">{unit.name}</Badge> : null;
                        })}
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'}>
                    {user.status === 'Active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(user)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPasswordClick(user)}>
                            Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteClick(user)}>
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

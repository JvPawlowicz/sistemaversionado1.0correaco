'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

interface NewUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NewUserDialog({ isOpen, onOpenChange }: NewUserDialogProps) {
  const [mounted, setMounted] = React.useState(false);
  const { addUser } = useUser();
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'Admin' | 'Therapist' | 'Receptionist'>('Therapist');
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }
    
    setIsSaving(true);
    
    const newUserData: Omit<User, 'id' | 'status' | 'avatarUrl' | 'createdAt'> = {
      name,
      email,
      role,
    };

    await addUser(newUserData);
    setIsSaving(false);
    onOpenChange(false);
    // Reset form
    setName('');
    setEmail('');
    setRole('Therapist');
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo usuário. <strong>Importante:</strong> Após salvar, crie a conta de login para este usuário (com o mesmo e-mail) na seção de Autenticação do console do Firebase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Função</Label>
              <Select onValueChange={(value) => setRole(value as any)} value={role} required>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Selecione uma função" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Therapist">Terapeuta</SelectItem>
                   <SelectItem value="Admin">Admin</SelectItem>
                   <SelectItem value="Receptionist">Recepcionista</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => {
                   setName('');
                   setEmail('');
                   setRole('Therapist');
                }}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

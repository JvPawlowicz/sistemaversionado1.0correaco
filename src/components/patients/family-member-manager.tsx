'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FamilyMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, CircleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { addFamilyMemberAction, deleteFamilyMemberAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface FamilyMemberManagerProps {
  patientId: string;
  familyMembers: FamilyMember[];
  isLoading: boolean;
  onFamilyMemberChange: () => void;
}

const addInitialState = { success: false, message: '', errors: null };

function AddSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Adicionar Familiar
    </Button>
  );
}

export function FamilyMemberManager({ patientId, familyMembers, isLoading, onFamilyMemberChange }: FamilyMemberManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [addState, formAction] = useActionState(addFamilyMemberAction.bind(null, patientId), addInitialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) {
      toast({ title: 'Sucesso!', description: addState.message });
      onFamilyMemberChange();
      setIsAddDialogOpen(false);
    } else if (addState.message && !addState.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: addState.message });
    }
  }, [addState, onFamilyMemberChange, toast]);

  const handleDelete = async (memberId: string) => {
    const result = await deleteFamilyMemberAction(patientId, memberId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onFamilyMemberChange();
    } else {
      toast({ variant: "destructive", title: "Erro", description: result.message });
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) formRef.current?.reset();
        setIsAddDialogOpen(open);
      }}>
        <DialogContent>
           <form ref={formRef} action={formAction}>
            <DialogHeader>
                <DialogTitle>Adicionar Familiar/Contato</DialogTitle>
                <DialogDescription>
                Preencha os dados do novo contato.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 {addState.message && !addState.success && !addState.errors && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <CircleAlert className="h-4 w-4" />
                        <p>{addState.message}</p>
                    </div>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" name="name" required />
                        {addState.errors?.name && <p className="text-xs text-destructive mt-1">{addState.errors.name[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="relationship">Parentesco</Label>
                        <Input id="relationship" name="relationship" required />
                         {addState.errors?.relationship && <p className="text-xs text-destructive mt-1">{addState.errors.relationship[0]}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea id="observations" name="observations" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <AddSubmitButton />
            </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>
      <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Familiar
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : familyMembers.length > 0 ? (
        <div className="space-y-3">
          {familyMembers.map((member) => (
            <Card key={member.id} className="bg-secondary/50">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.relationship}</CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover {member.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Não</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(member.id)} className="bg-destructive hover:bg-destructive/90">Sim, remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2 text-sm">
                <p><strong className="text-muted-foreground">Telefone:</strong> {member.phone || 'Não informado'}</p>
                <p><strong className="text-muted-foreground">Observações:</strong> {member.observations || 'Nenhuma'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum familiar ou contato adicionado.</p>
        </div>
      )}
    </div>
  );
}

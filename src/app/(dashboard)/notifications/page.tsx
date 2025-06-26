'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createNotificationAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CircleAlert, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const initialState = {
  success: false,
  message: '',
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar Notificação
    </Button>
  );
}

export default function NotificationsPage() {
  const [state, formAction] = useFormState(createNotificationAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      formRef.current?.reset();
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (currentUser?.role !== 'Admin') {
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
    );
  }

  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gerenciar Notificações
        </h1>
        <p className="text-muted-foreground">
          Crie e envie notificações para os usuários do sistema.
        </p>
      </div>

      <form ref={formRef} action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>Nova Notificação</CardTitle>
            <CardDescription>
              Esta notificação será exibida para os usuários.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {state.message && !state.success && !state.errors && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    <p>{state.message}</p>
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required />
              {state.errors?.title && <p className="text-xs text-destructive mt-1">{state.errors.title[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea id="content" name="content" required rows={5} />
              {state.errors?.content && <p className="text-xs text-destructive mt-1">{state.errors.content[0]}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

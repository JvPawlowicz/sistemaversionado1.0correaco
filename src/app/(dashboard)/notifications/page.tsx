'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { Loader2, CircleAlert, ShieldAlert, ChevronsUpDown, Check, BellRing } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { useUnit } from '@/contexts/UnitContext';
import { cn } from '@/lib/utils';
import { useNotification } from '@/contexts/NotificationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [state, formAction] = useActionState(createNotificationAction, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notifications, loading: notificationsLoading, fetchNotifications } = useNotification();
  
  const { users, loading: usersLoading } = useUser();
  const { units, loading: unitsLoading } = useUnit();

  const [targetType, setTargetType] = React.useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.success) {
      toast({ title: 'Sucesso!', description: state.message });
      fetchNotifications();
      formRef.current?.reset();
      setTargetType('ALL');
      setSelectedUserIds([]);
    } else if (state.message && !state.errors) {
      toast({ variant: 'destructive', title: 'Erro', description: state.message });
    }
  }, [state, toast, fetchNotifications]);

  if (authLoading) {
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

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const isLoading = usersLoading || unitsLoading;
  const userRoles = [...new Set(users.map(u => u.role))];


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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form ref={formRef} action={formAction}>
          <Card>
            <CardHeader>
              <CardTitle>Nova Notificação</CardTitle>
              <CardDescription>
                Crie uma notificação e escolha para quem ela será exibida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="space-y-4 rounded-md border p-4">
                <div className="space-y-2">
                    <Label>Enviar Para</Label>
                    <input type="hidden" name="targetType" value={targetType} />
                    <RadioGroup
                        value={targetType}
                        onValueChange={setTargetType}
                        className="grid grid-cols-2 gap-4"
                    >
                        <Label className="flex items-center gap-2 rounded-md p-2 border border-transparent hover:border-border cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                          <RadioGroupItem value="ALL" id="target-all" /> Todos os usuários
                        </Label>
                        <Label className="flex items-center gap-2 rounded-md p-2 border border-transparent hover:border-border cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                          <RadioGroupItem value="ROLE" id="target-role" /> Por Função
                        </Label>
                        <Label className="flex items-center gap-2 rounded-md p-2 border border-transparent hover:border-border cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                          <RadioGroupItem value="UNIT" id="target-unit" /> Por Unidade
                        </Label>
                        <Label className="flex items-center gap-2 rounded-md p-2 border border-transparent hover:border-border cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                          <RadioGroupItem value="SPECIFIC" id="target-specific" /> Usuários Específicos
                        </Label>
                    </RadioGroup>
                </div>

                {targetType === 'ROLE' && (
                    <Select name="targetRole" disabled={isLoading}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma função" /></SelectTrigger>
                      <SelectContent>
                        {userRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                )}
                {targetType === 'UNIT' && (
                    <Select name="targetUnitId" disabled={isLoading}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma unidade" /></SelectTrigger>
                      <SelectContent>
                        {units.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                )}
                {targetType === 'SPECIFIC' && (
                  <>
                    {selectedUserIds.map(id => <input key={id} type="hidden" name="targetUserIds" value={id} />)}
                    <Popover open={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10" disabled={isLoading}>
                          <div className="flex gap-1 flex-wrap">
                            {selectedUsers.length > 0 ? selectedUsers.map(user => (
                              <Badge variant="secondary" key={user.id} className="mr-1">{user.name}</Badge>
                            )) : "Selecione usuários..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar usuário..." />
                          <CommandList><CommandEmpty>Nenhum usuário.</CommandEmpty>
                            <CommandGroup>
                              {users.map(user => (
                                <CommandItem
                                  key={user.id} value={user.name}
                                  onSelect={() => {
                                    setSelectedUserIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]);
                                    setIsUserPopoverOpen(true);
                                  }}>
                                  <Check className={cn('mr-2 h-4 w-4', selectedUserIds.includes(user.id) ? 'opacity-100' : 'opacity-0')} />
                                  {user.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </Card>
        </form>

        <Card>
            <CardHeader>
                <CardTitle>Notificações Recentes</CardTitle>
                <CardDescription>Últimas 10 notificações enviadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {notificationsLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div key={notification.id} className="flex items-start gap-4 p-3 border rounded-lg bg-secondary/50">
                            <BellRing className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Enviado {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-48 text-center text-muted-foreground">
                        <p>Nenhuma notificação recente.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CircleAlert, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfessionalDetailsAction, updateUserAvatarAction } from '@/lib/actions/user';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { getDisplayAvatarUrl } from '@/lib/utils';

const roleNames: Record<string, string> = {
  Admin: 'Administrador',
  Therapist: 'Terapeuta',
  Receptionist: 'Recepcionista',
  Coordinator: 'Coordenador',
};

export default function ProfilePage() {
  const { currentUser, loading, updateUserName, refetchCurrentUser } = useAuth();
  const [isNameUpdating, setIsNameUpdating] = React.useState(false);
  const [name, setName] = React.useState(currentUser?.name || '');
  
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const avatarFormRef = React.useRef<HTMLFormElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isProfessionalUpdating, setIsProfessionalUpdating] = React.useState(false);
  const professionalFormRef = React.useRef<HTMLFormElement>(null);

  const { toast } = useToast();
  
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameUpdating(true);
    await updateUserName(name);
    setIsNameUpdating(false);
  };
  
  const handleProfessionalFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProfessionalUpdating(true);
    const formData = new FormData(event.currentTarget);
    const result = await updateUserProfessionalDetailsAction(null, formData);
    setIsProfessionalUpdating(false);

    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      refetchCurrentUser();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && avatarFormRef.current) {
        setIsAvatarUploading(true);
        const formData = new FormData(avatarFormRef.current);
        const result = await updateUserAvatarAction(null, formData);
        setIsAvatarUploading(false);

        if (result.success) {
            toast({ title: 'Sucesso!', description: result.message });
            refetchCurrentUser();
        } else {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: result.message });
        }
    }
  };


  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
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
  
  const isProfessional = currentUser.role === 'Therapist' || currentUser.role === 'Coordinator';
  const hasIncompleteProfessionalData = isProfessional && (!currentUser.professionalCouncil || !currentUser.councilNumber);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="flex flex-col items-center p-6 text-center">
            <form ref={avatarFormRef}>
              <input type="hidden" name="userId" value={currentUser.id} />
              <input 
                type="file" 
                name="avatar"
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
              />
              <Avatar className="h-24 w-24 mb-4 relative">
                <AvatarImage src={getDisplayAvatarUrl(currentUser.avatarUrl)} alt={currentUser.name} />
                <AvatarFallback className="text-3xl">{getInitials(currentUser.name)}</AvatarFallback>
                {isAvatarUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}
              </Avatar>
              <h2 className="text-xl font-semibold">{currentUser.name}</h2>
              <p className="text-muted-foreground">{currentUser.email}</p>
              <p className="text-sm text-muted-foreground mt-1">{roleNames[currentUser.role] || currentUser.role}</p>
              <div className="flex w-full mt-4 gap-2">
                <Button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1" disabled={isAvatarUploading}>
                  {isAvatarUploading ? 'Enviando...' : 'Escolher Foto'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <form onSubmit={handleUpdateName}>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize seu nome de exibição.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isNameUpdating} />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isNameUpdating}>
                  {isNameUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </form>
          </Card>

           {isProfessional && (
            <Card>
                <form onSubmit={handleProfessionalFormSubmit} ref={professionalFormRef}>
                    <input type="hidden" name="userId" value={currentUser.id} />
                    <CardHeader>
                        <CardTitle>Informações Profissionais</CardTitle>
                        <CardDescription>
                            Mantenha seus dados de conselho e especialidades atualizados.
                        </CardDescription>
                         {hasIncompleteProfessionalData && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Dados Profissionais Pendentes</AlertTitle>
                                <AlertDescription>
                                    É obrigatório o preenchimento dos seus dados de conselho profissional para utilizar a plataforma.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label htmlFor="professionalCouncil">Conselho</Label>
                             <Input id="professionalCouncil" name="professionalCouncil" defaultValue={currentUser.professionalCouncil || ''} placeholder="Ex: CREFITO, CRP" />
                          </div>
                           <div className="space-y-2">
                             <Label htmlFor="councilNumber">Número do Conselho</Label>
                             <Input id="councilNumber" name="councilNumber" defaultValue={currentUser.councilNumber || ''} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label htmlFor="specialties">Especialidades</Label>
                          <Textarea id="specialties" name="specialties" defaultValue={currentUser.specialties?.join(', ') || ''} placeholder="Ex: Terapia Ocupacional, Fisioterapia Motora" />
                          <p className="text-xs text-muted-foreground">Separe as especialidades por vírgula.</p>
                       </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit" disabled={isProfessionalUpdating}>
                            {isProfessionalUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Dados Profissionais
                        </Button>
                    </CardFooter>
                </form>
            </Card>
           )}

          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                A alteração de e-mail e senha deve ser feita através do administrador do sistema por motivos de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={currentUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value="********" disabled />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

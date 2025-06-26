'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const roleNames: Record<string, string> = {
  Admin: 'Administrador',
  Therapist: 'Terapeuta',
  Receptionist: 'Recepcionista',
  Coordinator: 'Coordenador',
};

export default function ProfilePage() {
  const { currentUser, loading, updateAvatar, updateUserName } = useAuth();
  const [isAvatarUpdating, setIsAvatarUpdating] = React.useState(false);
  const [isNameUpdating, setIsNameUpdating] = React.useState(false);
  const [name, setName] = React.useState(currentUser?.name || '');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
  }, [currentUser]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem com menos de 2MB.',
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateAvatar = async () => {
    if (!avatarFile) return;
    setIsAvatarUpdating(true);
    await updateAvatar(avatarFile);
    setIsAvatarUpdating(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameUpdating(true);
    await updateUserName(name);
    setIsNameUpdating(false);
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
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={avatarPreview || currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="text-3xl">{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{currentUser.name}</h2>
            <p className="text-muted-foreground">{currentUser.email}</p>
            <p className="text-sm text-muted-foreground mt-1">{roleNames[currentUser.role] || currentUser.role}</p>
            <div className="flex w-full mt-4 gap-2">
              <Button onClick={() => fileInputRef.current?.click()} className="flex-1">
                Escolher Foto
              </Button>
              {avatarFile && (
                <Button onClick={handleUpdateAvatar} disabled={isAvatarUpdating} className="flex-1">
                  {isAvatarUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              )}
            </div>
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

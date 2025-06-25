import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie sua conta e as configurações do aplicativo.
          </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Configurações de Perfil</CardTitle>
                <CardDescription>Este é um espaço para as configurações de perfil.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>O formulário de configurações do perfil do usuário estará aqui.</p>
            </CardContent>
        </Card>
    </div>
  );
}

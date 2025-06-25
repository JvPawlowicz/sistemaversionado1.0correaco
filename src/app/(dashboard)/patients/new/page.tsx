import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Adicionar Novo Paciente
        </h1>
      </div>
      <form>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Paciente</CardTitle>
            <CardDescription>Preencha o nome do novo paciente abaixo para o MVP.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="Digite o nome do paciente" required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
             <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" asChild>
                  <Link href="/patients">Cancelar</Link>
                </Button>
                <Button>Salvar</Button>
              </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

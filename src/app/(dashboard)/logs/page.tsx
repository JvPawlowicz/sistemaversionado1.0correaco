
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Logs do Sistema
        </h1>
        <p className="text-muted-foreground">
          Acompanhe as principais atividades realizadas na plataforma.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hammer className="text-primary"/> Em Construção</CardTitle>
        </CardHeader>
        <CardContent>
            <CardDescription>
                Este módulo registrará todas as ações importantes, como criação de usuários, agendamentos e alterações de dados. A funcionalidade completa de logs de auditoria está em desenvolvimento e estará disponível em breve.
            </CardDescription>
        </CardContent>
       </Card>
    </div>
  );
}

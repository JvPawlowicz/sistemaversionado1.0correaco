
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> Módulo Unificado</CardTitle>
        </CardHeader>
        <CardContent>
            <CardDescription>
                A funcionalidade de Relatórios foi unificada com a de Análise para criar uma experiência mais coesa. Você pode encontrar os relatórios detalhados na aba "Relatórios Detalhados" dentro do módulo "Análise e Relatórios".
            </CardDescription>
        </CardContent>
       </Card>
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function TeamPerformancePage() {
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> Módulo em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
            <CardDescription>
                Este módulo de Desempenho da Equipe está em desenvolvimento. Em breve, ele fornecerá análises detalhadas sobre a produtividade e os resultados dos profissionais.
            </CardDescription>
        </CardContent>
       </Card>
    </div>
  );
}

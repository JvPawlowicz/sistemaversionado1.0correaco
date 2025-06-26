
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Análise e Relatórios Inteligentes
        </h1>
        <p className="text-muted-foreground">
          Visualize o desempenho da clínica com dados e gráficos avançados.
        </p>
      </div>

       <Card className="mt-8">
        <CardHeader className="items-center text-center">
          <LineChart className="h-12 w-12 text-primary" />
          <CardTitle className="text-2xl">Módulo em Construção</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground">
                Em breve, esta seção fornecerá relatórios detalhados sobre taxa de ocupação,
                <br />
                desempenho por serviço, profissional e muito mais.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}


import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import {
  Calendar,
  FileText,
  ClipboardCheck,
  LineChart,
  Target,
  Users,
  Building,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="#" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold">Equidade+</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
              Funcionalidades
            </Link>
            <Link href="#for-whom" className="text-muted-foreground transition-colors hover:text-foreground">
              Para Quem É?
            </Link>
            <Link href="#contact" className="text-muted-foreground transition-colors hover:text-foreground">
              Contato
            </Link>
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative w-full py-20 md:py-32 lg:py-40">
           <div
            className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20"
            style={{ backgroundImage: "url('https://placehold.co/1920x1080.png')" }}
            data-ai-hint="abstract background"
          />
          <div className="container relative text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              A Gestão Clínica que Entende o Cuidado Multidisciplinar.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              Centralize agendamentos, planos terapêuticos e evoluções em um só lugar. Uma plataforma projetada para as necessidades de clínicas com foco em neurodivergência.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="/login">Acessar a Plataforma</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tudo o que você precisa para uma gestão integrada.
              </h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="items-center">
                  <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <CardTitle>Agenda Inteligente</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Gestão de horários individuais, em grupo, com controle de recursos e integração de convênios.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center">
                   <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <FileText className="h-8 w-8" />
                  </div>
                  <CardTitle>PTI e Evoluções</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Crie Planos Terapêuticos dinâmicos e vincule-os às evoluções diárias de forma simples.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center">
                   <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <ClipboardCheck className="h-8 w-8" />
                  </div>
                  <CardTitle>Avaliações Padronizadas</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Aplique protocolos e avaliações com cálculo de resultados para agilizar o diagnóstico.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center">
                   <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <LineChart className="h-8 w-8" />
                  </div>
                  <CardTitle>Relatórios e Análise</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Tome decisões baseadas em dados com dashboards e relatórios de desempenho da clínica e equipe.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* For Whom Section */}
        <section id="for-whom" className="w-full py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Uma Plataforma Pensada para Toda a Equipe
              </h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
              <Card className="flex flex-col items-center text-center">
                <CardHeader>
                  <Building className="h-10 w-10 text-primary" />
                  <CardTitle>Para Gestores</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-muted-foreground">
                  Tenha uma visão 360º da sua operação, com relatórios financeiros, de produtividade e gestão centralizada de unidades e usuários.
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center">
                <CardHeader>
                  <Target className="h-10 w-10 text-primary" />
                  <CardTitle>Para Terapeutas</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-muted-foreground">
                  Foque no atendimento. Documente evoluções, acompanhe metas do PTI e aplique avaliações de forma rápida e intuitiva.
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center text-center">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary" />
                  <CardTitle>Para a Recepção</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-muted-foreground">
                  Organize a agenda de todos os profissionais, gerencie o fluxo de pacientes e centralize as informações de cadastro e convênios.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="cta" className="w-full bg-primary/5 py-20">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para transformar a gestão da sua clínica?
            </h2>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/login">Acessar a Plataforma</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t bg-muted/50">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-bold">Equidade+</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground"><Twitter /></Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground"><Instagram /></Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground"><Linkedin /></Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-4 text-sm text-muted-foreground md:flex-row">
            <p>&copy; {new Date().getFullYear()} Equidade+. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link href="#">Termos de Serviço</Link>
              <Link href="#">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

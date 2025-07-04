import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons';
import {
  Calendar,
  FileText,
  Star,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold">Equidade+</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
            <Link href="/#features" className="text-muted-foreground transition-colors hover:text-foreground">
              Funcionalidades
            </Link>
            <Link href="/#testimonials" className="text-muted-foreground transition-colors hover:text-foreground">
              Depoimentos
            </Link>
            <Link href="/#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
              Preços
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
        <section id="hero" className="w-full py-20 md:py-32 lg:py-40">
          <div className="container grid grid-cols-1 items-center gap-8 text-center lg:grid-cols-2 lg:text-left">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                A Gestão Clínica que Entende o Cuidado Multidisciplinar.
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-muted-foreground md:text-xl lg:mx-0">
                Centralize agendamentos, planos terapêuticos e evoluções em um só lugar. Uma plataforma projetada para as necessidades de clínicas com foco em neurodivergência.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
                <Button size="lg" asChild>
                  <Link href="/login">Começar Agora <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/#features">Ver Funcionalidades</Link>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-2xl">
                <Image
                    src="https://placehold.co/1200x800.png"
                    width={1200}
                    height={800}
                    alt="Dashboard da Plataforma Equidade+"
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="dashboard analytics"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted py-20 md:py-24">
          <div className="container space-y-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tudo o que você precisa para uma gestão integrada.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Deixe a burocracia de lado e foque no que realmente importa: o cuidado e a evolução dos seus pacientes.
              </p>
            </div>
            {/* Feature 1 */}
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 p-3 text-primary">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Agenda Inteligente e Flexível</h3>
                <p className="text-muted-foreground">
                  Organize os horários de múltiplos profissionais com facilidade. Crie agendamentos individuais ou em grupo, gerencie salas e equipamentos, e integre com planos de saúde para faturamento automático.
                </p>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>Visualizações por dia, semana e mês.</li>
                  <li>Lógica de sobreposição para múltiplos eventos.</li>
                  <li>Bloqueios de horários para reuniões e feriados.</li>
                </ul>
              </div>
              <Image
                src="https://placehold.co/800x600.png"
                width={800}
                height={600}
                alt="Agenda Inteligente"
                className="rounded-xl shadow-lg"
                data-ai-hint="calendar schedule"
              />
            </div>
            {/* Feature 2 */}
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
                 <Image
                    src="https://placehold.co/800x600.png"
                    width={800}
                    height={600}
                    alt="Plano Terapêutico Individual"
                    className="rounded-xl shadow-lg lg:order-first"
                    data-ai-hint="therapist notes"
                />
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 p-3 text-primary">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Plano Terapêutico Individual (PTI) e Evoluções</h3>
                <p className="text-muted-foreground">
                  Crie planos de tratamento personalizados com metas de longo prazo e objetivos de curto prazo. Vincule cada evolução de sessão diretamente aos objetivos, registrando o progresso de forma clara e visual.
                </p>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>Defina critérios de maestria para cada objetivo.</li>
                  <li>Visualize o progresso com gráficos automáticos.</li>
                  <li>Use modelos para agilizar a criação de registros.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Amado por Clínicas em Todo o Brasil</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Veja o que nossos parceiros estão dizendo sobre a transformação que o Equidade+ trouxe para suas operações.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex space-x-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <blockquote className="mt-4 text-lg font-semibold leading-relaxed">
                    &ldquo;O Equidade+ revolucionou nossa gestão. A economia de tempo com documentação nos permitiu focar 100% nos pacientes. A visão integrada da agenda e dos planos terapêuticos é fantástica.&rdquo;
                  </blockquote>
                </CardContent>
                <CardHeader className="flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="woman portrait" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Ana da Silva</CardTitle>
                    <CardDescription>Coordenadora da Clínica Crescer</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex space-x-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <blockquote className="mt-4 text-lg font-semibold leading-relaxed">
                    &ldquo;Como terapeuta, ter acesso rápido ao PTI e registrar a evolução na mesma tela é um divisor de águas. Os gráficos de progresso ajudam muito nas conversas com os pais.&rdquo;
                  </blockquote>
                </CardContent>
                <CardHeader className="flex-row items-center gap-4">
                   <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="man portrait" />
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">João Pereira</CardTitle>
                    <CardDescription>Fisioterapeuta</CardDescription>
                  </div>
                </CardHeader>
              </Card>
               <Card>
                <CardContent className="pt-6">
                  <div className="flex space-x-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <blockquote className="mt-4 text-lg font-semibold leading-relaxed">
                    &ldquo;A organização da agenda de todos os terapeutas ficou muito mais clara. Consigo gerenciar o fluxo da recepção de forma eficiente e sem conflitos de horários. Recomendo!&rdquo;
                  </blockquote>
                </CardContent>
                <CardHeader className="flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="woman professional" />
                    <AvatarFallback>CS</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">Carla Souza</CardTitle>
                    <CardDescription>Recepcionista</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="pricing" className="w-full bg-muted py-20">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para transformar a gestão da sua clínica?
            </h2>
             <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Junte-se a dezenas de clínicas que já estão otimizando seu tempo e melhorando a qualidade do cuidado.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/login">Começar Agora <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 space-y-4 md:col-span-1">
              <Link href="/" className="flex items-center space-x-2">
                <Logo className="h-8 w-8" />
                <span className="text-xl font-bold">Equidade+</span>
              </Link>
              <p className="text-sm text-muted-foreground">Potencializando o cuidado multidisciplinar.</p>
            </div>
            <div>
              <h4 className="font-semibold">Produto</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/#features" className="text-muted-foreground hover:text-foreground">Funcionalidades</Link></li>
                <li><Link href="/#pricing" className="text-muted-foreground hover:text-foreground">Preços</Link></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Empresa</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/" className="text-muted-foreground hover:text-foreground">Sobre Nós</Link></li>
                <li><Link href="/" className="text-muted-foreground hover:text-foreground">Contato</Link></li>
              </ul>
            </div>
             <div>
              <h4 className="font-semibold">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/" className="text-muted-foreground hover:text-foreground">Termos de Serviço</Link></li>
                <li><Link href="/" className="text-muted-foreground hover:text-foreground">Política de Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; 2024 Equidade+. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

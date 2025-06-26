'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sparkles } from 'lucide-react';

const POPUP_SHOWN_KEY = 'authorPopupShown';

export function AuthorPopup() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // This code runs only on the client
    const hasBeenShown = sessionStorage.getItem(POPUP_SHOWN_KEY);
    if (!hasBeenShown) {
      setIsOpen(true);
      sessionStorage.setItem(POPUP_SHOWN_KEY, 'true');
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
             <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <AlertDialogTitle className="text-center text-2xl font-bold">
            Olá, seja bem-vindo ao Equidade+ (versão Alpha)!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left text-muted-foreground pt-4 text-base">
                <p>
                    Eu sou o João, talvez a gente já tenha trabalhado diretamente no Grupo Equidade, mas hoje, quero te apresentar algo ainda mais especial.
                </p>
                <p>
                    Desde criança, convivo com o TDAH e sempre fui movido por inovação, criatividade e tecnologia. Foi essa paixão que me trouxe até aqui, e agora você faz parte disso também.
                </p>
                <p>
                    O Equidade+ nasce como um novo capítulo do Grupo Equidade, uma plataforma pensada para atender às necessidades reais de clínicas multidisciplinares por todo o Brasil. Esse é o início de um grande sonho, e você está participando dos primeiros passos!
                </p>
                <p className="font-semibold text-foreground">
                    Seja bem-vindo ao futuro. Seja bem-vindo ao Equidade+.
                </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="!mt-6 text-center text-sm p-3 rounded-lg bg-secondary/70">
            <p>💬 Precisa de ajuda, quer dar um feedback ou tirar dúvidas?<br/> Fale direto comigo no WhatsApp: <strong className="font-semibold text-foreground">(16) 99630-8848</strong></p>
        </div>
        <AlertDialogFooter className="!mt-6">
          <AlertDialogAction onClick={() => setIsOpen(false)} className="w-full">
            Vamos começar!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

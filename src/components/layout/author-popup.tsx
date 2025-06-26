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
import { Hand, MessageCircle } from 'lucide-react';

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
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
             <Hand className="h-10 w-10 text-primary" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">Uma Mensagem Importante</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground pt-2">
            Esta plataforma é fruto de um trabalho individual. Qualquer dúvida ou necessidade, por favor, não hesite em entrar em contato.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-secondary">
          <MessageCircle className="h-5 w-5 text-primary" />
          <p className="font-mono font-semibold text-lg">16 99630-8848</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setIsOpen(false)} className="w-full">
            Entendido, fechar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

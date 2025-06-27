import { SidebarTrigger } from '@/components/ui/sidebar';
import { UnitSwitcher } from './unit-switcher';
import { UserNav } from './user-nav';
import { ThemeToggle } from '../theme-toggle';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import { Clock } from './clock';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <Clock />
        <UnitSwitcher />
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <Bell />
          <span className="sr-only">Notificações</span>
        </Button>
        <UserNav />
      </div>
    </header>
  );
}

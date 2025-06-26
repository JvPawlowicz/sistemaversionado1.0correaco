import { SidebarTrigger } from '@/components/ui/sidebar';
import { UnitSwitcher } from './unit-switcher';
import { UserNav } from './user-nav';
import { ThemeToggle } from '../theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <UnitSwitcher />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}

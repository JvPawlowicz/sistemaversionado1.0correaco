'use client';

import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UnitSwitcher } from './unit-switcher';
import { UserNav } from './user-nav';
import { ThemeToggle } from '../theme-toggle';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import { Clock } from './clock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { markNotificationAsSeenAction } from '@/lib/actions/notification';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';


export function Header() {
  const { notifications, fetchNotifications } = useNotification();
  const { currentUser } = useAuth();

  const handleMarkAsSeen = async (notificationId: string) => {
    if (!currentUser) return;
    const result = await markNotificationAsSeenAction(notificationId, currentUser.id);
    if (result.success) {
      await fetchNotifications();
    }
  };

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <Clock />
        <UnitSwitcher />
        <ThemeToggle />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                        {unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notificações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 whitespace-normal p-3" onSelect={(e) => e.preventDefault()}>
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.content}</p>
                        <div className="w-full flex justify-between items-center mt-2">
                            <p className="text-xs text-muted-foreground">
                                {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora'}
                            </p>
                            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => handleMarkAsSeen(notification.id)}>Marcar como lida</Button>
                        </div>
                        </DropdownMenuItem>
                    ))
                    ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground h-full">
                        <p>Nenhuma notificação nova.</p>
                    </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
        <UserNav />
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { LayoutDashboard, Users, HeartPulse, Settings, LogOut, Calendar, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, currentUser } = useAuth();

  const menuItems = [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/schedule', label: 'Agenda', icon: Calendar },
    { href: '/patients', label: 'Pacientes', icon: HeartPulse },
    { href: '/users', label: 'Usuários', icon: Users, adminOnly: true },
    { href: '/ai-notes', label: 'Anotações IA', icon: Bot },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Equidade+</span>
        </Link>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          (!item.adminOnly || currentUser?.role === 'Admin') && (
            <SidebarMenuItem key={item.href}>
               <Link href={item.href} passHref>
                  <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                  >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        ))}
      </SidebarMenu>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton isActive={pathname.startsWith('/settings')} tooltip="Configurações">
                <Settings />
                <span>Configurações</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={logout} className="cursor-pointer">
                <LogOut />
                <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

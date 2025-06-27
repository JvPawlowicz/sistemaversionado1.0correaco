
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
import { LayoutDashboard, Users, HeartPulse, LogOut, Calendar, BarChart3, Bell, Building, SlidersHorizontal, Users2, LineChart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, currentUser } = useAuth();
  
  const isAdmin = currentUser?.role === 'Admin';
  const isCoordinator = currentUser?.role === 'Coordinator';

  const menuItems = [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/schedule', label: 'Agenda', icon: Calendar, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/patients', label: 'Pacientes', icon: HeartPulse, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/groups', label: 'Grupos', icon: Users2, roles: ['Admin', 'Coordinator', 'Therapist'] },
    { href: '/analysis', label: 'Análise e Relatórios', icon: LineChart, roles: ['Admin', 'Coordinator'] },
    { href: '/planning', label: 'Planejamento', icon: SlidersHorizontal, roles: ['Admin', 'Coordinator'] },
    { href: '/units', label: 'Unidades', icon: Building, roles: ['Admin'] },
    { href: '/users', label: 'Usuários', icon: Users, roles: ['Admin'] },
    { href: '/notifications', label: 'Notificações', icon: Bell, roles: ['Admin'] },
  ];
  
  const userHasAccess = (roles: string[]) => currentUser && roles.includes(currentUser.role);

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
          userHasAccess(item.roles) && (
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

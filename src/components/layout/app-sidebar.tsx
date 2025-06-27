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
import { 
  LayoutDashboard, 
  Users, 
  HeartPulse, 
  LogOut, 
  Calendar, 
  Bell, 
  Building, 
  SlidersHorizontal, 
  LineChart, 
  FileText, 
  MessageSquare,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, currentUser } = useAuth();
  const { selectedUnitId } = useUnit();
  
  const userHasAccess = (roles: string[]) => currentUser && roles.includes(currentUser.role);

  const coreItems = [
    { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/schedule', label: 'Agenda', icon: Calendar, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/patients', label: 'Pacientes', icon: HeartPulse, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/chat', label: 'Chat', icon: MessageSquare, roles: ['Admin', 'Coordinator', 'Therapist', 'Receptionist'] },
    { href: '/evolutions', label: 'Evoluções', icon: FileText, roles: ['Admin', 'Coordinator', 'Therapist'] },
  ];
  const managementItems = [
    { href: '/analysis', label: 'Análise e Relatórios', icon: LineChart, roles: ['Admin', 'Coordinator'] },
    { href: '/planning', label: 'Planejamento', icon: SlidersHorizontal, roles: ['Admin', 'Coordinator'] },
  ];
  const adminItems = [
    { href: '/units', label: 'Unidades', icon: Building, roles: ['Admin'] },
    { href: '/users', label: 'Usuários', icon: Users, roles: ['Admin'] },
    { href: '/notifications', label: 'Notificações', icon: Bell, roles: ['Admin'] },
  ];

  const visibleManagementItems = managementItems.filter(item => userHasAccess(item.roles));
  
  const isCoordinator = userHasAccess(['Coordinator']);
  const showCoordinatorSettings = isCoordinator && selectedUnitId && selectedUnitId !== 'central';
  
  const hasCoreItems = coreItems.some(item => userHasAccess(item.roles));
  const hasManagementItems = visibleManagementItems.length > 0 || showCoordinatorSettings;
  const hasAdminItems = adminItems.some(item => userHasAccess(item.roles));


  const renderMenuItems = (items: typeof coreItems) => {
    return items.map((item) => (
      userHasAccess(item.roles) && (
        <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                  tooltip={item.label}
              >
                  <item.icon />
                  <span>{item.label}</span>
              </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      )
    ));
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Equidade+</span>
        </Link>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {hasCoreItems && <div className="flex flex-col gap-1">{renderMenuItems(coreItems)}</div>}
        
        {hasCoreItems && hasManagementItems && <SidebarSeparator className="my-1" />}
        
        {hasManagementItems && (
          <div className="flex flex-col gap-1">
            {renderMenuItems(managementItems)}
            {showCoordinatorSettings && (
              <SidebarMenuItem>
                <Link href={`/units/${selectedUnitId}`} passHref>
                  <SidebarMenuButton
                      isActive={pathname === `/units/${selectedUnitId}`}
                      tooltip="Configurar Unidade"
                  >
                      <Settings />
                      <span>Configurar Unidade</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
          </div>
        )}
        
        {hasManagementItems && hasAdminItems && <SidebarSeparator className="my-1" />}
        
        {hasAdminItems && <div className="flex flex-col gap-1">{renderMenuItems(adminItems)}</div>}
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

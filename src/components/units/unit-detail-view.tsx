'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Upload } from 'lucide-react';
import type { Unit, Service } from '@/lib/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { ServiceManager } from './service-manager';
import { UnitForm } from './unit-form';
import { RoomManager } from './room-manager';
import { useAuth } from '@/contexts/AuthContext';

export function UnitDetailView({
  unit,
  onUnitUpdated,
  onUnitDeleted,
  onServiceChange,
}: {
  unit: Unit;
  onUnitUpdated: () => void;
  onUnitDeleted: () => void;
  onServiceChange: (unitId: string, service: Omit<Service, 'id' | 'unitId'>) => Promise<void>;
}) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'Admin';
    
    return (
        <div className="space-y-6">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a unidade <span className="font-semibold">{unit.name}</span>? Esta ação é permanente e removerá todos os serviços e dados associados.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onUnitDeleted} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
                <CardHeader className="flex flex-col items-start gap-4 sm:flex-row">
                    <div className="relative h-24 w-24 flex-shrink-0">
                         <Image
                            src={unit.photoUrl || 'https://placehold.co/400x400.png'}
                            alt={unit.name}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg border"
                            data-ai-hint="clinic building"
                        />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-3xl">{unit.name}</CardTitle>
                        <CardDescription className="mt-2 text-base">
                            ID da Unidade: {unit.id}
                        </CardDescription>
                         <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>CNPJ: {unit.cnpj || 'Não informado'}</span>
                            <span>Telefone: {unit.phone || 'Não informado'}</span>
                         </div>
                    </div>
                    {isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Unidade
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>
            </Card>

            {isAdmin ? (
                <Tabs defaultValue="services">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="services">Serviços</TabsTrigger>
                        <TabsTrigger value="rooms">Salas</TabsTrigger>
                        <TabsTrigger value="details">Dados Cadastrais</TabsTrigger>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="services">
                        <Card>
                        <CardHeader>
                            <CardTitle>Serviços Oferecidos</CardTitle>
                            <CardDescription>Gerencie os serviços prestados nesta unidade e os profissionais vinculados a cada um.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <ServiceManager unit={unit} onServiceChange={onServiceChange} />
                        </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="rooms">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gestão de Salas</CardTitle>
                                <CardDescription>Cadastre e gerencie as salas de atendimento disponíveis nesta unidade.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RoomManager unit={unit} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="details">
                         <UnitForm unit={unit} onUnitUpdated={onUnitUpdated} />
                    </TabsContent>
                     <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documentos Institucionais</CardTitle>
                                <CardDescription>Gerencie alvarás, CNES e outros documentos da unidade.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center">
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <p className="text-muted-foreground">Funcionalidade de upload em breve.</p>
                            </CardContent>
                        </Card>
                     </TabsContent>
                </Tabs>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Gestão de Salas</CardTitle>
                        <CardDescription>Cadastre e gerencie as salas de atendimento disponíveis nesta unidade.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RoomManager unit={unit} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnit } from '@/contexts/UnitContext';
import { Loader2, Plus, Terminal, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteUnitDialog } from '@/components/settings/delete-unit-dialog';
import type { Unit } from '@/lib/types';

function AddRoomForm({ unitId }: { unitId: string }) {
  const [roomName, setRoomName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const { addRoomToUnit } = useUnit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsSaving(true);
    await addRoomToUnit(unitId, roomName.trim());
    setRoomName('');
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <Input
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Nome da nova sala"
        className="flex-1"
        disabled={isSaving}
      />
      <Button type="submit" size="sm" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Adicionar Sala
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const { units, loading, error, addUnit } = useUnit();
  const { currentUser } = useAuth();
  const [newUnitName, setNewUnitName] = React.useState('');
  const [isAddingUnit, setIsAddingUnit] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null);

  const handleDeleteClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    setIsAddingUnit(true);
    await addUnit(newUnitName.trim());
    setNewUnitName('');
    setIsAddingUnit(false);
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="space-y-6">
      <DeleteUnitDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        unit={selectedUnit}
      />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas unidades, salas e outras configurações do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Unidades</CardTitle>
          <CardDescription>
            Adicione novas unidades e gerencie as salas de cada uma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Dados</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {units.map((unit) => (
                <AccordionItem value={unit.id} key={unit.id}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-2">
                      <span>{unit.name}</span>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent accordion from toggling
                            handleDeleteClick(unit);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <h4 className="font-semibold mb-2">Salas nesta Unidade:</h4>
                    {unit.rooms.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {unit.rooms.map((room, index) => (
                          <Badge key={index} variant="secondary">
                            {room}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma sala cadastrada para esta unidade.
                      </p>
                    )}
                    {isAdmin && <AddRoomForm unitId={unit.id} />}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Unidade</CardTitle>
          </CardHeader>
          <form onSubmit={handleAddUnit}>
            <CardContent>
              <Label htmlFor="new-unit-name">Nome da Unidade</Label>
              <Input
                id="new-unit-name"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Ex: Unidade Principal"
                disabled={isAddingUnit}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isAddingUnit}>
                {isAddingUnit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Criar Unidade
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}

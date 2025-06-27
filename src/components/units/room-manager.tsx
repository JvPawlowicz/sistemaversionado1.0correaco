'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Unit } from '@/lib/types';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';

interface RoomManagerProps {
  unit: Unit;
}

export function RoomManager({ unit }: RoomManagerProps) {
  const { updateUnitRooms } = useUnit();
  const [newRoom, setNewRoom] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const handleAddRoom = async () => {
    if (!newRoom.trim()) return;
    setIsSaving(true);
    const currentRooms = unit.rooms || [];
    if (currentRooms.map(r => r.toLowerCase()).includes(newRoom.trim().toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Sala já existe',
            description: `A sala "${newRoom.trim()}" já está cadastrada.`,
        });
        setIsSaving(false);
        return;
    }
    const updatedRooms = [...currentRooms, newRoom.trim()];
    await updateUnitRooms(unit.id, updatedRooms);
    setNewRoom('');
    setIsSaving(false);
  };

  const handleDeleteRoom = async (roomToDelete: string) => {
    setIsSaving(true);
    const updatedRooms = (unit.rooms || []).filter(room => room !== roomToDelete);
    await updateUnitRooms(unit.id, updatedRooms);
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="Nome da nova sala (Ex: Sala 1, Consultório Azul)"
          onKeyDown={(e) => { if(e.key === 'Enter') handleAddRoom()}}
        />
        <Button onClick={handleAddRoom} disabled={isSaving || !newRoom.trim()}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Adicionar
        </Button>
      </div>
      <div className="space-y-2 rounded-md border p-4">
        <h4 className="font-medium">Salas Cadastradas</h4>
        {(unit.rooms && unit.rooms.length > 0) ? (
          <ul className="space-y-2">
            {unit.rooms.sort().map((room, index) => (
              <li key={index} className="flex items-center justify-between rounded-md bg-secondary/50 p-2 text-sm">
                <span>{room}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteRoom(room)}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sala cadastrada nesta unidade.</p>
        )}
      </div>
    </div>
  );
}

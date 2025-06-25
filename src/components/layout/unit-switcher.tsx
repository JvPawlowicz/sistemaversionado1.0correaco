'use client';

import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useUnit } from '@/contexts/UnitContext';
import { Skeleton } from '../ui/skeleton';

export function UnitSwitcher() {
  const [open, setOpen] = React.useState(false);
  const { units, loading } = useUnit();
  const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [loading, units, selectedUnitId]);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  if (loading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={units.length === 0}
        >
          {selectedUnit ? selectedUnit.name : 'Nenhuma unidade'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar unidade..." />
          <CommandList>
            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
            <CommandGroup>
              {units.map((unit) => (
                <CommandItem
                  key={unit.id}
                  value={unit.name}
                  onSelect={(currentValue) => {
                    const selected = units.find(
                      (u) => u.name.toLowerCase() === currentValue.toLowerCase()
                    );
                    if (selected) {
                      setSelectedUnitId(selected.id);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedUnitId === unit.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {unit.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

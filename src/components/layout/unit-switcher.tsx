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

const units = [
  { value: 'main-street', label: 'Main Street Unit' },
  { value: 'downtown-center', label: 'Downtown Center' },
  { value: 'south-branch', label: 'South Branch' },
];

export function UnitSwitcher() {
  const [open, setOpen] = React.useState(false);
  const [selectedUnit, setSelectedUnit] = React.useState(units[0]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedUnit.label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search unit..." />
          <CommandEmpty>No unit found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {units.map((unit) => (
                <CommandItem
                  key={unit.value}
                  onSelect={(currentValue) => {
                    const selected = units.find((u) => u.label.toLowerCase() === currentValue);
                    if (selected) {
                      setSelectedUnit(selected);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedUnit.value === unit.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {unit.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

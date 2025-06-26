
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUnit } from '@/contexts/UnitContext';
import { Skeleton } from '@/components/ui/skeleton';
import { UnitDetailView } from '@/components/units/unit-detail-view';
import type { Unit } from '@/lib/types';


export default function UnitDetailPage() {
  const params = useParams<{ id: string }>();
  const { units, loading: unitsLoading, fetchUnits, addServiceToUnit, deleteUnit } = useUnit();
  const router = useRouter();

  const unit = units.find((u) => u.id === params.id);
  
  React.useEffect(() => {
    if (!unitsLoading && !unit) {
      router.push('/units');
    }
  }, [unitsLoading, unit, router]);
  
  const handleUnitDeleted = async () => {
    if (!unit) return;
    await deleteUnit(unit.id);
    router.push('/units');
  }

  if (unitsLoading || !unit) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <UnitDetailView 
        unit={unit} 
        onUnitUpdated={fetchUnits}
        onUnitDeleted={handleUnitDeleted}
        onServiceChange={addServiceToUnit}
    />
  );
}


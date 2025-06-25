'use client';

import { notFound } from 'next/navigation';
import { evolutionRecords, reports } from '@/lib/placeholder-data';
import { PatientDetailView } from '@/components/patients/patient-detail-view';
import { usePatient } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const { patients } = usePatient();
  const patient = patients.find((p) => p.id === params.id);

  if (!patient) {
    // This part might not be hit if the context is loading,
    // so we handle the loading state below.
    // In a real app with async data fetching, you would show a loading state
    // and then call notFound() if the fetch fails.
    return (
       <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <PatientDetailView patient={patient} records={evolutionRecords} reports={reports} />
  );
}

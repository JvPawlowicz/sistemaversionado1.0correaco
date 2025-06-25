'use client';

import { notFound, useRouter } from 'next/navigation';
import { evolutionRecords, reports } from '@/lib/placeholder-data';
import { PatientDetailView } from '@/components/patients/patient-detail-view';
import { usePatient } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const { patients, loading } = usePatient();
  const router = useRouter();

  const patient = patients.find((p) => p.id === params.id);

  useEffect(() => {
    if (!loading && !patient) {
      // After loading is complete, if patient is still not found, redirect.
      router.push('/patients');
    }
  }, [loading, patient, router]);

  if (loading || !patient) {
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

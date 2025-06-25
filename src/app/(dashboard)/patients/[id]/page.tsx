import { notFound } from 'next/navigation';
import { patients, evolutionRecords, reports } from '@/lib/placeholder-data';
import { PatientDetailView } from '@/components/patients/patient-detail-view';

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const patient = patients.find((p) => p.id === params.id);

  if (!patient) {
    notFound();
  }

  return (
    <PatientDetailView patient={patient} records={evolutionRecords} reports={reports} />
  );
}

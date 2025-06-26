'use client';

import { useRouter } from 'next/navigation';
import { PatientDetailView } from '@/components/patients/patient-detail-view';
import { usePatient } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useCallback } from 'react';
import type { Patient, EvolutionRecord, PatientDocument } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const { patients, loading: patientsLoading } = usePatient();
  const router = useRouter();
  const [records, setRecords] = useState<EvolutionRecord[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const patient = patients.find((p) => p.id === params.id);

  const fetchRecords = useCallback(async () => {
    if (!patient || !db) return;
    setRecordsLoading(true);
    try {
      const recordsCollectionRef = collection(db, 'patients', patient.id, 'evolutionRecords');
      const q = query(recordsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedRecords = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const date = data.createdAt.toDate();
          return {
              id: doc.id,
              ...data,
              date: format(date, 'PPP p', { locale: ptBR }),
          } as EvolutionRecord;
      });
      setRecords(fetchedRecords);
    } catch (error) {
        console.error("Error fetching evolution records: ", error);
    } finally {
        setRecordsLoading(false);
    }
  }, [patient]);

  const fetchDocuments = useCallback(async () => {
    if (!patient || !db) return;
    setDocumentsLoading(true);
    try {
      const docsCollectionRef = collection(db, 'patients', patient.id, 'documents');
      const q = query(docsCollectionRef, orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedDocs = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              uploadedAt: data.uploadedAt.toDate(),
          } as PatientDocument;
      });
      setDocuments(fetchedDocs);
    } catch (error) {
        console.error("Error fetching documents: ", error);
    } finally {
        setDocumentsLoading(false);
    }
  }, [patient]);


  useEffect(() => {
    if (!patientsLoading && !patient) {
      router.push('/patients');
    } else if (patient) {
      fetchRecords();
      fetchDocuments();
    }
  }, [patientsLoading, patient, router, fetchRecords, fetchDocuments]);

  if (patientsLoading || !patient) {
    return (
       <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <PatientDetailView
      patient={patient}
      records={records}
      recordsLoading={recordsLoading}
      onRecordAdded={fetchRecords}
      documents={documents}
      documentsLoading={documentsLoading}
      onDocumentAdded={fetchDocuments}
    />
  );
}

'use client';

import { useRouter, useParams } from 'next/navigation';
import { PatientDetailView } from '@/components/patients/patient-detail-view';
import { usePatient } from '@/contexts/PatientContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useCallback } from 'react';
import type { Patient, EvolutionRecord, PatientDocument, FamilyMember, TherapyGroup, Assessment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useTherapyGroup } from '@/contexts/TherapyGroupContext';
import { useAssessment } from '@/contexts/AssessmentContext';

export default function PatientProfilePage() {
  const params = useParams<{ id: string }>();
  const { patients, loading: patientsLoading, fetchPatients } = usePatient();
  const { therapyGroups, loading: groupsLoading } = useTherapyGroup();
  const { assessments, loading: assessmentsLoading } = useAssessment();
  
  const router = useRouter();
  const [records, setRecords] = useState<EvolutionRecord[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [familyMembersLoading, setFamilyMembersLoading] = useState(true);

  const patient = patients.find((p) => p.id === params.id);
  const patientAssessments = assessments.filter(a => a.patientId === params.id);

  const handlePatientDeleted = () => {
    router.push('/patients');
  };

  const fetchRecords = useCallback(async () => {
    if (!patient || !db) return;
    setRecordsLoading(true);
    try {
      const recordsCollectionRef = collection(db, 'patients', patient.id, 'evolutionRecords');
      const q = query(recordsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedRecords = querySnapshot.docs.map(doc => {
          return {
              id: doc.id,
              ...doc.data(),
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

  const fetchFamilyMembers = useCallback(async () => {
    if (!patient || !db) return;
    setFamilyMembersLoading(true);
    try {
      const familyCollectionRef = collection(db, 'patients', patient.id, 'familyMembers');
      const q = query(familyCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedFamilyMembers = querySnapshot.docs.map(doc => {
          return {
              id: doc.id,
              ...doc.data(),
          } as FamilyMember;
      });
      setFamilyMembers(fetchedFamilyMembers);
    } catch (error) {
        console.error("Error fetching family members: ", error);
    } finally {
        setFamilyMembersLoading(false);
    }
  }, [patient]);

  useEffect(() => {
    if (!patientsLoading && !patient) {
      router.push('/patients');
    } else if (patient) {
      fetchRecords();
      fetchDocuments();
      fetchFamilyMembers();
    }
  }, [patientsLoading, patient, router, fetchRecords, fetchDocuments, fetchFamilyMembers]);

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
      familyMembers={familyMembers}
      familyMembersLoading={familyMembersLoading}
      onFamilyMemberChange={fetchFamilyMembers}
      therapyGroups={therapyGroups}
      groupsLoading={groupsLoading}
      onPatientDeleted={handlePatientDeleted}
      onPatientUpdated={fetchPatients}
      assessments={patientAssessments}
      assessmentsLoading={assessmentsLoading}
    />
  );
}

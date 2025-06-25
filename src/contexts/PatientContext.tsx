'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Patient } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'status' | 'avatarUrl' | 'createdAt'>) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsCollection = collection(db, 'patients');
      const q = query(patientsCollection, orderBy('createdAt', 'desc'));
      const patientSnapshot = await getDocs(q);
      const patientList = patientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      setPatients(patientList);
    } catch (error) {
      console.error("Error fetching patients: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar pacientes",
        description: "Não foi possível carregar a lista de pacientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit' | 'status' | 'avatarUrl' | 'createdAt'>) => {
    try {
      const patientsCollection = collection(db, 'patients');
      await addDoc(patientsCollection, {
        ...patientData,
        status: 'Active',
        lastVisit: new Date().toISOString().split('T')[0],
        avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
        createdAt: serverTimestamp()
      });
      toast({
        title: "Sucesso",
        description: "Paciente adicionado com sucesso.",
      });
      await fetchPatients();
    } catch (error) {
      console.error("Error adding patient: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar paciente",
        description: "Ocorreu um erro ao tentar salvar o paciente.",
      });
    }
  };

  return (
    <PatientContext.Provider value={{ patients, loading, addPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}

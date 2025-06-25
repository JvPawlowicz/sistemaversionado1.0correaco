'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Patient } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'status' | 'avatarUrl' | 'createdAt'>) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPatients = async () => {
    if (!db) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      setError(null);
      const patientsCollection = collection(db, 'patients');
      const q = query(patientsCollection);
      const patientSnapshot = await getDocs(q);
      const patientList = patientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      
      // Sort client-side to avoid index dependency
      patientList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setPatients(patientList);
    } catch (err: any) {
      console.error("Error fetching patients: ", err);
      const userFriendlyError = "Falha ao buscar pacientes. Verifique se a coleção 'patients' existe no Firestore e se as regras de segurança permitem a leitura.";
      setError(userFriendlyError);
      setPatients([]);
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
    if (!db) {
        toast({
            variant: "destructive",
            title: "Erro de Configuração",
            description: "A configuração do Firebase está ausente. Não é possível adicionar pacientes.",
        });
        return;
    }
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
    <PatientContext.Provider value={{ patients, loading, error, addPatient }}>
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

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Patient } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from './UnitContext';
import { useAuth } from './AuthContext';

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'status' | 'avatarUrl' | 'createdAt'>) => Promise<void>;
  fetchPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedUnitId } = useUnit();
  const { currentUser, loading: authLoading } = useAuth();

  const fetchPatients = useCallback(async () => {
    if (authLoading || !currentUser) {
      setLoading(false);
      setPatients([]);
      return;
    }
    
    if (!db) {
        setError("A configuração do Firebase está ausente. Não é possível buscar pacientes.");
        setLoading(false);
        return;
    }
    
    if (currentUser.role !== 'Admin' && !selectedUnitId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const patientsCollection = collection(db, 'patients');

      let q: Query;
      if (currentUser.role === 'Admin') {
        q = query(patientsCollection);
      } else {
        q = query(patientsCollection, where('unitIds', 'array-contains', selectedUnitId));
      }

      const patientSnapshot = await getDocs(q);
      const patientList = patientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      
      patientList.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      setPatients(patientList);
    } catch (err: any) {
      console.error("Error fetching patients: ", err);
      const userFriendlyError = "Falha ao buscar pacientes. Verifique as regras de segurança e se o índice necessário foi criado no Firestore.";
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
  }, [toast, selectedUnitId, currentUser, authLoading]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

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
    <PatientContext.Provider value={{ patients, loading: loading || authLoading, error, addPatient, fetchPatients }}>
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

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Appointment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { colors } from '@/lib/placeholder-data';

interface ScheduleContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'color'>) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!db) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      setError(null);
      const appointmentsCollection = collection(db, 'appointments');
      const q = query(appointmentsCollection, orderBy('createdAt', 'desc'));
      const appointmentSnapshot = await getDocs(q);
      const appointmentList = appointmentSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data
        } as Appointment
      });
      setAppointments(appointmentList);
    } catch (err: any) {
      console.error("Error fetching appointments: ", err);
      const userFriendlyError = "Falha ao buscar agendamentos. Verifique se a coleção 'appointments' existe e se as regras de segurança estão corretas. Pode ser necessário criar um índice no Firestore.";
      setError(userFriendlyError);
      setAppointments([]);
      toast({
        variant: "destructive",
        title: "Erro ao buscar agendamentos",
        description: "Não foi possível carregar a lista de agendamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'color'>) => {
    if (!db) {
        toast({
            variant: "destructive",
            title: "Erro de Configuração",
            description: "A configuração do Firebase está ausente.",
        });
        return;
    }
    try {
      const appointmentsCollection = collection(db, 'appointments');
      const color = colors[Math.floor(Math.random() * colors.length)];
      await addDoc(appointmentsCollection, {
        ...appointmentData,
        color,
        createdAt: serverTimestamp()
      });
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso.",
      });
      await fetchAppointments();
    } catch (error) {
      console.error("Error adding appointment: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: "Ocorreu um erro ao tentar salvar o agendamento.",
      });
    }
  };

  return (
    <ScheduleContext.Provider value={{ appointments, loading, error, addAppointment }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}

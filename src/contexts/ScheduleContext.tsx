'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Appointment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, deleteDoc, updateDoc, getDoc, writeBatch, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { colors } from '@/lib/placeholder-data';
import { useUnit } from './UnitContext';
import { addWeeks, format } from 'date-fns';
import { useAuth } from './AuthContext';

interface ScheduleContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  addAppointment: (data: { appointment: Omit<Appointment, 'id' | 'createdAt' | 'color' | 'status'>; repeat: boolean }) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: 'Realizado' | 'Faltou' | 'Cancelado') => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedUnitId } = useUnit();
  const { currentUser } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (!db) {
        setError("A configuração do Firebase está ausente. Não é possível buscar agendamentos.");
        setLoading(false);
        return;
    }
    if (!selectedUnitId) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const appointmentsCollection = collection(db, 'appointments');
      
      let q: Query;
      if (selectedUnitId === 'central' && currentUser?.role === 'Admin') {
        q = query(appointmentsCollection);
      } else {
        q = query(appointmentsCollection, where('unitId', '==', selectedUnitId));
      }
      
      const appointmentSnapshot = await getDocs(q);
      const appointmentList = appointmentSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data
        } as Appointment
      });
      
      appointmentList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setAppointments(appointmentList);
    } catch (err: any)
    {
      console.error("Error fetching appointments: ", err);
      const userFriendlyError = "Falha ao buscar agendamentos. Verifique as regras de segurança e se o índice necessário foi criado no Firestore.";
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
  }, [toast, selectedUnitId, currentUser]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async ({ appointment: appointmentData, repeat }: { appointment: Omit<Appointment, 'id' | 'createdAt' | 'color' | 'status'>; repeat: boolean }) => {
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

      const appointmentsToAdd = [];
      appointmentsToAdd.push({
        ...appointmentData,
        status: 'Agendado',
        color,
        createdAt: serverTimestamp()
      });

      if (repeat) {
        for (let i = 1; i <= 4; i++) {
          const originalDate = new Date(appointmentData.date + 'T12:00:00Z'); // Use a fixed time to avoid timezone issues
          const nextDate = addWeeks(originalDate, i);
          const formattedNextDate = format(nextDate, 'yyyy-MM-dd');
          
          appointmentsToAdd.push({
            ...appointmentData,
            date: formattedNextDate,
            status: 'Agendado',
            color,
            createdAt: serverTimestamp()
          });
        }
      }

      for (const app of appointmentsToAdd) {
        await addDoc(appointmentsCollection, app);
      }
      
      toast({
        title: "Sucesso",
        description: `Agendamento${appointmentsToAdd.length > 1 ? 's' : ''} criado${appointmentsToAdd.length > 1 ? 's' : ''} com sucesso.`,
      });
      await fetchAppointments();
    } catch (error) {
      console.error("Error adding appointment(s): ", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: "Ocorreu um erro ao tentar salvar o(s) agendamento(s).",
      });
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!db) {
        toast({ variant: "destructive", title: "Erro de Configuração" });
        return;
    }
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      toast({
        title: "Sucesso",
        description: "Agendamento excluído.",
      });
      await fetchAppointments();
    } catch (error) {
      console.error("Error deleting appointment: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir agendamento",
      });
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'Realizado' | 'Faltou' | 'Cancelado') => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Erro de Configuração' });
      return;
    }
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);

      if (!appointmentDoc.exists()) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Agendamento não encontrado.'});
        return;
      }

      const appointmentData = appointmentDoc.data();
      const batch = writeBatch(db);

      batch.update(appointmentRef, { status: status });

      let toastDescription = 'Status do agendamento foi atualizado.';
      if (status === 'Realizado') {
        const patientRef = doc(db, 'patients', appointmentData.patientId);
        batch.update(patientRef, { lastVisit: appointmentData.date });
        toastDescription = 'Status atualizado para "Realizado" e última visita do paciente registrada.'
      }

      await batch.commit();
      
      toast({
        title: 'Sucesso',
        description: toastDescription,
      });

      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
      });
    }
  };

  return (
    <ScheduleContext.Provider value={{ appointments, loading, error, addAppointment, deleteAppointment, updateAppointmentStatus }}>
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

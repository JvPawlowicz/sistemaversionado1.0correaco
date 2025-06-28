
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Appointment, TimeBlock } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, deleteDoc, updateDoc, getDoc, writeBatch, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { colors } from '@/lib/placeholder-data';
import { useUnit } from './UnitContext';
import { addWeeks, format } from 'date-fns';
import { useAuth } from './AuthContext';
import { usePatient } from './PatientContext';

interface ScheduleContextType {
  appointments: Appointment[];
  timeBlocks: TimeBlock[];
  loading: boolean;
  error: string | null;
  addAppointment: (data: AddAppointmentData) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: 'Realizado' | 'Faltou' | 'Cancelado') => Promise<void>;
}

export interface AddAppointmentData {
  baseAppointment: Omit<Appointment, 'id' | 'createdAt' | 'color' | 'status' | 'patientId' | 'patientName'>;
  patientId?: string;
  patientIds?: string[];
  patientNames?: { [id: string]: string };
  isGroup: boolean;
  repeat: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedUnitId } = useUnit();
  const { currentUser } = useAuth();
  const { patients } = usePatient();

  const fetchScheduleData = useCallback(async () => {
    if (!db) {
        setError("A configuração do Firebase está ausente.");
        setLoading(false);
        return;
    }
    if (!selectedUnitId) {
      setAppointments([]);
      setTimeBlocks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Fetch Appointments
      const appointmentsCollection = collection(db, 'appointments');
      let appQuery: Query;
      if (selectedUnitId === 'central' && currentUser?.role === 'Admin') {
        appQuery = query(appointmentsCollection);
      } else {
        appQuery = query(appointmentsCollection, where('unitId', '==', selectedUnitId));
      }
      const appointmentSnapshot = await getDocs(appQuery);
      const appointmentList = appointmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      appointmentList.sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
      setAppointments(appointmentList);

      // Fetch Time Blocks
      const timeBlocksCollection = collection(db, 'timeBlocks');
      let blockQuery: Query;
       if (selectedUnitId === 'central' && currentUser?.role === 'Admin') {
        blockQuery = query(timeBlocksCollection);
      } else {
        blockQuery = query(timeBlocksCollection, where('unitId', '==', selectedUnitId));
      }
      const timeBlockSnapshot = await getDocs(blockQuery);
      const timeBlockList = timeBlockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeBlock));
      setTimeBlocks(timeBlockList);

    } catch (err: any) {
      console.error("Error fetching schedule data: ", err);
      const userFriendlyError = "Falha ao buscar dados da agenda. Verifique as regras de segurança e se os índices necessários foram criados no Firestore.";
      setError(userFriendlyError);
      setAppointments([]);
      setTimeBlocks([]);
      toast({
        variant: "destructive",
        title: "Erro ao buscar dados da agenda",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedUnitId, currentUser]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const addAppointment = async (data: AddAppointmentData) => {
    if (!db) {
      toast({ variant: "destructive", title: "Erro de Configuração" });
      return;
    }

    const { baseAppointment, isGroup, patientId, patientIds, patientNames, repeat } = data;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const batch = writeBatch(db);
    
    const createAppointmentsForDate = (date: string) => {
        if (isGroup && patientIds && patientNames) {
            patientIds.forEach(pId => {
                const newAppRef = doc(collection(db, 'appointments'));
                batch.set(newAppRef, {
                    ...baseAppointment,
                    patientId: pId,
                    patientName: patientNames[pId],
                    attendees: patientIds,
                    date,
                    status: 'Agendado',
                    color,
                    createdAt: serverTimestamp(),
                });
            });
        } else if (!isGroup && patientId && patientNames) {
            const patient = patients.find(p => p.id === patientId);
            const newAppRef = doc(collection(db, 'appointments'));
            batch.set(newAppRef, {
                ...baseAppointment,
                patientId: patientId,
                patientName: patientNames[patientId],
                healthPlanId: patient?.healthPlanId || null,
                healthPlanName: patient?.healthPlanName || null,
                date,
                status: 'Agendado',
                color,
                createdAt: serverTimestamp(),
            });
        }
    };

    try {
        createAppointmentsForDate(baseAppointment.date);

        if (repeat) {
            for (let i = 1; i <= 4; i++) {
                const originalDate = new Date(baseAppointment.date + 'T12:00:00Z');
                const nextDate = addWeeks(originalDate, i);
                const formattedNextDate = format(nextDate, 'yyyy-MM-dd');
                createAppointmentsForDate(formattedNextDate);
            }
        }
        
        await batch.commit();

        toast({
            title: "Sucesso",
            description: "Agendamento(s) criado(s) com sucesso.",
        });
        await fetchScheduleData();
    } catch (error) {
        console.error("Error adding appointment(s): ", error);
        toast({
            variant: "destructive",
            title: "Erro ao criar agendamento",
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
      await fetchScheduleData();
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

      await fetchScheduleData();
    } catch (error) {
      console.error('Error updating appointment status: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
      });
    }
  };

  return (
    <ScheduleContext.Provider value={{ appointments, timeBlocks, loading, error, addAppointment, deleteAppointment, updateAppointmentStatus }}>
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

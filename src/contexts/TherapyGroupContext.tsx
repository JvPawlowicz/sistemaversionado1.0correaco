'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { TherapyGroup } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from './UnitContext';
import { useAuth } from './AuthContext';

interface TherapyGroupContextType {
  therapyGroups: TherapyGroup[];
  loading: boolean;
  error: string | null;
  fetchTherapyGroups: () => Promise<void>;
}

const TherapyGroupContext = createContext<TherapyGroupContextType | undefined>(undefined);

export function TherapyGroupProvider({ children }: { children: ReactNode }) {
  const [therapyGroups, setTherapyGroups] = useState<TherapyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedUnitId } = useUnit();
  const { currentUser } = useAuth();

  const fetchTherapyGroups = useCallback(async () => {
    if (!db || !selectedUnitId || !currentUser) {
      setTherapyGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const groupsCollection = collection(db, 'therapyGroups');
      let q: Query;

      if (selectedUnitId === 'central' && currentUser.role === 'Admin') {
        q = query(groupsCollection);
      } else {
        q = query(groupsCollection, where('unitId', '==', selectedUnitId));
      }

      const querySnapshot = await getDocs(q);
      const groupList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TherapyGroup));

      groupList.sort((a, b) => a.name.localeCompare(b.name));
      setTherapyGroups(groupList);
    } catch (err: any) {
      console.error("Error fetching therapy groups: ", err);
      setError("Falha ao buscar grupos de terapia.");
      setTherapyGroups([]);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os grupos de terapia." });
    } finally {
      setLoading(false);
    }
  }, [selectedUnitId, currentUser, toast]);

  useEffect(() => {
    fetchTherapyGroups();
  }, [fetchTherapyGroups]);

  return (
    <TherapyGroupContext.Provider value={{ therapyGroups, loading, error, fetchTherapyGroups }}>
      {children}
    </TherapyGroupContext.Provider>
  );
}

export function useTherapyGroup() {
  const context = useContext(TherapyGroupContext);
  if (context === undefined) {
    throw new Error('useTherapyGroup must be used within a TherapyGroupProvider');
  }
  return context;
}

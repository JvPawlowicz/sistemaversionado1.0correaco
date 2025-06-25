'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Unit } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UnitContextType {
  units: Unit[];
  loading: boolean;
  error: string | null;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  addUnit: (unitName: string) => Promise<void>;
  addRoomToUnit: (unitId: string, roomName: string) => Promise<void>;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnits = useCallback(async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setError(null);
      const unitsCollection = collection(db, 'units');
      const q = query(unitsCollection);
      const unitSnapshot = await getDocs(q);
      const unitList = unitSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Unit));

      unitList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setUnits(unitList);

      // Set the first unit as selected by default if none is selected
      if (unitList.length > 0 && !selectedUnitId) {
        setSelectedUnitId(unitList[0].id);
      } else if (unitList.length === 0) {
        setSelectedUnitId(null);
      }

    } catch (err: any) {
      console.error("Error fetching units: ", err);
      const userFriendlyError = "Falha ao buscar unidades. Verifique se a coleção 'units' existe e se as regras de segurança estão corretas.";
      setError(userFriendlyError);
      setUnits([]);
      toast({
        variant: "destructive",
        title: "Erro ao buscar unidades",
        description: "Não foi possível carregar a lista de unidades.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedUnitId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const addUnit = async (unitName: string) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'units'), {
        name: unitName,
        rooms: [],
        createdAt: serverTimestamp()
      });
      toast({ title: "Sucesso", description: "Unidade criada." });
      await fetchUnits();
    } catch (error) {
      console.error("Error adding unit: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a unidade." });
    }
  };

  const addRoomToUnit = async (unitId: string, roomName: string) => {
    if (!db) return;
    try {
      const unitRef = doc(db, 'units', unitId);
      await updateDoc(unitRef, {
        rooms: arrayUnion(roomName)
      });
      toast({ title: "Sucesso", description: "Sala adicionada." });
      await fetchUnits();
    } catch (error) {
      console.error("Error adding room: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar a sala." });
    }
  };

  return (
    <UnitContext.Provider value={{ units, loading, error, addUnit, addRoomToUnit, selectedUnitId, setSelectedUnitId }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}

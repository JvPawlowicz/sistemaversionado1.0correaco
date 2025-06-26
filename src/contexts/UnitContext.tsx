'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Unit } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

interface UnitContextType {
  units: Unit[];
  loading: boolean;
  error: string | null;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  addUnit: (unitName: string) => Promise<void>;
  addRoomToUnit: (unitId: string, roomName: string) => Promise<void>;
  fetchUnits: () => Promise<void>;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

const CENTRAL_UNIT_ID = 'central';

export function UnitProvider({ children }: { children: ReactNode }) {
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const centralUnit: Unit = {
    id: CENTRAL_UNIT_ID,
    name: 'Central (Todas as Unidades)',
    rooms: [],
  };

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

      setAllUnits(unitList);

    } catch (err: any) {
      console.error("Error fetching units: ", err);
      const userFriendlyError = "Falha ao buscar unidades. Verifique se a coleção 'units' existe e se as regras de segurança estão corretas.";
      setError(userFriendlyError);
      setAllUnits([]);
      toast({
        variant: "destructive",
        title: "Erro ao buscar unidades",
        description: "Não foi possível carregar a lista de unidades.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSetSelectedUnitId = (id: string | null) => {
    setSelectedUnitId(id);
    if (id) {
        localStorage.setItem('selectedUnitId', id);
    } else {
        localStorage.removeItem('selectedUnitId');
    }
  };

  useEffect(() => {
    if (authLoading || !currentUser) {
      setUnits([]);
      setSelectedUnitId(null);
      return;
    }

    let availableUnits: Unit[];
    if (currentUser.role === 'Admin') {
      availableUnits = [centralUnit, ...allUnits];
    } else {
      const userUnitIds = currentUser.unitIds || [];
      availableUnits = allUnits.filter(unit => userUnitIds.includes(unit.id));
    }
    
    setUnits(availableUnits);
    
    const storedUnitId = localStorage.getItem('selectedUnitId');
    if (storedUnitId && availableUnits.some(u => u.id === storedUnitId)) {
        if (selectedUnitId !== storedUnitId) {
            setSelectedUnitId(storedUnitId);
        }
    } else if (!availableUnits.some(u => u.id === selectedUnitId)) {
      handleSetSelectedUnitId(availableUnits.length > 0 ? availableUnits[0].id : null);
    }
  }, [currentUser, allUnits, authLoading]);


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
    <UnitContext.Provider value={{ units, loading: loading || authLoading, error, addUnit, addRoomToUnit, selectedUnitId, setSelectedUnitId: handleSetSelectedUnitId, fetchUnits }}>
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

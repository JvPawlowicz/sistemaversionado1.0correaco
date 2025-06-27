
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Unit, Service } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

interface UnitContextType {
  units: Unit[];
  loading: boolean;
  error: string | null;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  addUnit: (unitData: Omit<Unit, 'id' | 'createdAt' | 'services' | 'rooms'>) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;
  addServiceToUnit: (unitId: string, serviceData: Omit<Service, 'id' | 'unitId'>) => Promise<void>;
  deleteService: (unitId: string, serviceId: string) => Promise<void>;
  updateUnitRooms: (unitId: string, rooms: string[]) => Promise<void>;
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
      const unitSnapshot = await getDocs(query(unitsCollection));
      
      const unitListPromises = unitSnapshot.docs.map(async (unitDoc) => {
        const unitData = unitDoc.data() as Omit<Unit, 'id' | 'services'>;
        const servicesCollection = collection(db, 'units', unitDoc.id, 'services');
        const servicesSnapshot = await getDocs(query(servicesCollection));
        const services = servicesSnapshot.docs.map(serviceDoc => ({
          id: serviceDoc.id,
          ...serviceDoc.data()
        } as Service));
        
        return {
          id: unitDoc.id,
          ...unitData,
          services,
        } as Unit;
      });

      const unitList = await Promise.all(unitListPromises);

      unitList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setAllUnits(unitList);

    } catch (err: any) {
      console.error("Error fetching units: ", err);
      setError("Falha ao buscar unidades.");
      setAllUnits([]);
      toast({ variant: "destructive", title: "Erro ao buscar unidades" });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, allUnits, authLoading]);


  const addUnit = async (unitData: Omit<Unit, 'id' | 'createdAt' | 'services' | 'rooms'>) => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'units'), {
        ...unitData,
        createdAt: serverTimestamp()
      });
      toast({ title: "Sucesso", description: "Unidade criada." });
      await fetchUnits();
    } catch (error) {
      console.error("Error adding unit: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a unidade." });
    }
  };
  
  const deleteUnit = async (unitId: string) => {
    if (!db) return;
    try {
        // This is a simplified deletion. In a real app, you'd handle deleting subcollections and associated data.
        await deleteDoc(doc(db, 'units', unitId));
        toast({ title: "Sucesso", description: "Unidade excluída." });
        await fetchUnits();
    } catch(error) {
        console.error("Error deleting unit: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a unidade." });
    }
  }

  const addServiceToUnit = async (unitId: string, serviceData: Omit<Service, 'id' | 'unitId'>) => {
    if (!db) return;
    try {
      const servicesCollection = collection(db, 'units', unitId, 'services');
      await addDoc(servicesCollection, serviceData);
      toast({ title: "Sucesso", description: "Serviço adicionado." });
      await fetchUnits();
    } catch (error) {
      console.error("Error adding service: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o serviço." });
    }
  };
  
  const deleteService = async (unitId: string, serviceId: string) => {
    if (!db) return;
    try {
        const serviceRef = doc(db, 'units', unitId, 'services', serviceId);
        await deleteDoc(serviceRef);
        toast({ title: 'Sucesso', description: 'Serviço removido.'});
        await fetchUnits();
    } catch (error) {
         console.error("Error deleting service: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o serviço." });
    }
  }
  
  const updateUnitRooms = async (unitId: string, rooms: string[]) => {
    if (!db) return;
    try {
      const unitRef = doc(db, 'units', unitId);
      await updateDoc(unitRef, { rooms });
      toast({ title: "Sucesso", description: "Lista de salas atualizada com sucesso." });
      await fetchUnits();
    } catch (error) {
      console.error("Error updating unit rooms: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar as salas da unidade." });
    }
  };

  return (
    <UnitContext.Provider value={{ units, loading: loading || authLoading, error, addUnit, deleteUnit, addServiceToUnit, deleteService, selectedUnitId, setSelectedUnitId: handleSetSelectedUnitId, fetchUnits, updateUnitRooms }}>
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

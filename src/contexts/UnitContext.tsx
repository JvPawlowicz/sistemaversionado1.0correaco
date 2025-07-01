'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Unit, Service, HealthPlan } from '@/lib/types';
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
  addHealthPlanToUnit: (unitId: string, planData: Omit<HealthPlan, 'id' | 'unitId'>) => Promise<void>;
  deleteHealthPlan: (unitId: string, planId: string) => Promise<void>;
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
  
  // This state ensures we only access localStorage on the client after mounting.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        const unitData = unitDoc.data() as Omit<Unit, 'id' | 'services' | 'healthPlans'>;

        const servicesCollection = collection(db, 'units', unitDoc.id, 'services');
        const servicesSnapshot = await getDocs(query(servicesCollection));
        const services = servicesSnapshot.docs.map(serviceDoc => ({
          id: serviceDoc.id,
          ...serviceDoc.data()
        } as Service));
        
        const healthPlansCollection = collection(db, 'units', unitDoc.id, 'healthPlans');
        const healthPlansSnapshot = await getDocs(query(healthPlansCollection));
        const healthPlans = healthPlansSnapshot.docs.map(planDoc => ({
          id: planDoc.id,
          ...planDoc.data()
        } as HealthPlan));
        
        return {
          id: unitDoc.id,
          ...unitData,
          services,
          healthPlans,
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

  // This effect handles setting the available units for the user and initializing the selected unit.
  useEffect(() => {
    // Don't do anything until mounted on client and all data is loaded
    if (!isMounted || authLoading || loading || !currentUser) {
      return;
    }

    // Determine units available to the current user
    let availableUnits: Unit[];
    if (currentUser.role === 'Admin') {
      availableUnits = [centralUnit, ...allUnits];
    } else {
      const userUnitIds = currentUser.unitIds || [];
      availableUnits = allUnits.filter(unit => userUnitIds.includes(unit.id));
    }
    setUnits(availableUnits);
    
    // Safely determine the initial selected unit
    const storedUnitId = localStorage.getItem('selectedUnitId');
    if (storedUnitId && availableUnits.some(u => u.id === storedUnitId)) {
      setSelectedUnitId(storedUnitId);
    } else if (availableUnits.length > 0) {
      setSelectedUnitId(availableUnits[0].id);
    } else {
      setSelectedUnitId(null);
    }
  }, [isMounted, currentUser, allUnits, authLoading, loading]);
  
  // This effect persists the selectedUnitId to localStorage whenever it changes.
  const handleSetSelectedUnitId = useCallback((id: string | null) => {
      setSelectedUnitId(id);
      if (isMounted) {
          if (id) {
              localStorage.setItem('selectedUnitId', id);
          } else {
              localStorage.removeItem('selectedUnitId');
          }
      }
  }, [isMounted]);


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

  const addHealthPlanToUnit = async (unitId: string, planData: Omit<HealthPlan, 'id' | 'unitId'>) => {
    if (!db) return;
    try {
      const plansCollection = collection(db, 'units', unitId, 'healthPlans');
      await addDoc(plansCollection, { ...planData, unitId });
      toast({ title: "Sucesso", description: "Plano de saúde adicionado." });
      await fetchUnits();
    } catch (error) {
      console.error("Error adding health plan: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o plano de saúde." });
    }
  };
  
  const deleteHealthPlan = async (unitId: string, planId: string) => {
    if (!db) return;
    try {
        const planRef = doc(db, 'units', unitId, 'healthPlans', planId);
        await deleteDoc(planRef);
        toast({ title: 'Sucesso', description: 'Plano de saúde removido.'});
        await fetchUnits();
    } catch (error) {
        console.error("Error deleting health plan: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o plano de saúde." });
    }
  }


  return (
    <UnitContext.Provider value={{ units, loading: loading || authLoading, error, addUnit, deleteUnit, addServiceToUnit, deleteService, addHealthPlanToUnit, deleteHealthPlan, selectedUnitId, setSelectedUnitId: handleSetSelectedUnitId, fetchUnits, updateUnitRooms }}>
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

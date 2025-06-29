'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Assessment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from './UnitContext';
import { useAuth } from './AuthContext';

interface AssessmentContextType {
  assessments: Assessment[];
  loading: boolean;
  error: string | null;
  fetchAssessments: () => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedUnitId, units } = useUnit();
  const { currentUser } = useAuth();

  const fetchAssessments = useCallback(async () => {
    if (!db || !selectedUnitId || !currentUser) {
      setAssessments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const assessmentsCollection = collection(db, 'assessments');
      let q: Query;
      
      if (currentUser.role === 'Admin' && selectedUnitId === 'central') {
        q = query(assessmentsCollection);
      } else {
        q = query(assessmentsCollection, where('unitId', '==', selectedUnitId));
      }
      const querySnapshot = await getDocs(q);
      const assessmentList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Assessment));

      // Sort on the client to avoid composite index requirement
      assessmentList.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      
      setAssessments(assessmentList);
    } catch (err: any) {
      console.error("Error fetching assessments: ", err);
      setError("Falha ao buscar avaliações.");
      setAssessments([]);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as avaliações." });
    } finally {
      setLoading(false);
    }
  }, [selectedUnitId, currentUser, toast]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  return (
    <AssessmentContext.Provider value={{ assessments, loading, error, fetchAssessments }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}

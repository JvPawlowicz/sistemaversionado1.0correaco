'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { EvolutionTemplate } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TemplateContextType {
  templates: EvolutionTemplate[];
  loading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<EvolutionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    if (!db || !currentUser) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const templatesCollection = collection(db, 'evolutionTemplates');
      const q = query(
        templatesCollection,
        where('userId', '==', currentUser.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templateList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as EvolutionTemplate));
      
      setTemplates(templateList);

    } catch (err: any) {
      console.error("Error fetching templates:", err);
      setError("Falha ao buscar modelos de evolução.");
      setTemplates([]);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar seus modelos." });
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser) {
      fetchTemplates();
    }
  }, [currentUser, fetchTemplates]);

  return (
    <TemplateContext.Provider value={{ templates, loading, error, fetchTemplates }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}

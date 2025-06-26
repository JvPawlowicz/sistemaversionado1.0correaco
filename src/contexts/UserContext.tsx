'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUnit } from './UnitContext';

interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedUnitId } = useUnit();

  const fetchUsers = useCallback(async () => {
    if (!db) {
        setError("A configuração do Firebase está ausente. Não é possível buscar usuários.");
        setLoading(false);
        return;
    }
    if (!selectedUnitId) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('unitIds', 'array-contains', selectedUnitId));
      const userSnapshot = await getDocs(q);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));

      userList.sort((a, b) => a.name.localeCompare(b.name));
      
      setUsers(userList);
    } catch (err: any) {
      console.error("Error fetching users: ", err);
      const userFriendlyError = "Falha ao buscar usuários. Verifique se a coleção 'users' existe no Firestore e se as regras de segurança permitem a leitura.";
      setError(userFriendlyError);
      setUsers([]);
      toast({
        variant: "destructive",
        title: "Erro ao buscar usuários",
        description: "Não foi possível carregar la lista de usuários.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedUnitId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <UserContext.Provider value={{ users, loading, error, fetchUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

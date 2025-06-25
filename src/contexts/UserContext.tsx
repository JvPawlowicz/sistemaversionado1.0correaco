'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    if (!db) {
        setError("A configuração do Firebase está ausente. Não é possível buscar usuários.");
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      setError(null);
      const usersCollection = collection(db, 'users');
      // In a real app with many users, you might filter by selectedUnitId here too
      // For now, we fetch all to allow admins to see everyone.
      const q = query(usersCollection);
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
        description: "Não foi possível carregar a lista de usuários.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // We refetch users when the component mounts.
    // Server Actions will use revalidatePath to trigger updates after mutations.
    fetchUsers();
  }, [fetchUsers]);

  return (
    <UserContext.Provider value={{ users, loading, error }}>
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

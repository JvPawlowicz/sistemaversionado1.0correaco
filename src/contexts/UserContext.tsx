'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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

  const fetchUsers = async () => {
    if (!db) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      setError(null);
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, orderBy('name', 'asc'));
      const userSnapshot = await getDocs(q);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(userList);
    } catch (err: any) {
      console.error("Error fetching users: ", err);
      const userFriendlyError = "Falha ao buscar usuários. Verifique se a coleção 'users' existe no Firestore e se as regras de segurança permitem a leitura. Pode ser necessário criar um índice no Firestore.";
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

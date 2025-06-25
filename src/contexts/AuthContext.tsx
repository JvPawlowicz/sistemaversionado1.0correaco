'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as AuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AuthUser | null;
  currentUser: User | null; // Our custom user profile from Firestore
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          const usersCollectionRef = collection(db, 'users');
          const q = query(usersCollectionRef, where('email', '==', authUser.email), limit(1));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            // User exists in Auth, but no profile in 'users' collection.
            // Let's check if this is the VERY first user.
            const allUsersSnapshot = await getDocs(query(usersCollectionRef, limit(1)));
            
            if (allUsersSnapshot.empty) {
              // This is the first user ever! Let's make them an Admin.
              toast({
                title: 'Bem-vindo, Administrador!',
                description: 'Detectamos que este é o primeiro login. Seu perfil de administrador foi criado automaticamente.',
              });

              const newUserDocRef = await addDoc(usersCollectionRef, {
                name: authUser.email?.split('@')[0] || 'Admin',
                email: authUser.email,
                role: 'Admin',
                status: 'Active',
                avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
                createdAt: serverTimestamp()
              });

              // Set the current user in state immediately so they don't get logged out
              setCurrentUser({
                id: newUserDocRef.id,
                name: authUser.email?.split('@')[0] || 'Admin',
                email: authUser.email!,
                role: 'Admin',
                status: 'Active',
                avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
              });

            } else {
              // Not the first user, and profile is missing. This is the intended error.
              toast({
                variant: 'destructive',
                title: 'Perfil não encontrado',
                description: 'Sua conta de login existe, mas não há um perfil de usuário associado. Contate um administrador.',
              });
              await signOut(auth); // Log them out
              setCurrentUser(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
              variant: 'destructive',
              title: 'Erro de Perfil',
              description: 'Não foi possível carregar seu perfil de usuário.',
            });
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, pass: string) => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'A configuração do Firebase está ausente. Verifique o console para mais detalhes.',
      });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: 'Verifique seu e-mail e senha.',
      });
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    if (!auth) {
       toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'A configuração do Firebase está ausente. Verifique o console para mais detalhes.',
      });
      return;
    }
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Ocorreu um problema ao tentar fazer logout.',
      });
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    currentUser,
    isAuthenticated: !loading && !!user && !!currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

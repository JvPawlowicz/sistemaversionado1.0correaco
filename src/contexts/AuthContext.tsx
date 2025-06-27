
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as AuthUser } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref as storage_ref, uploadBytes, getDownloadURL } from 'firebase/storage';


interface AuthContextType {
  user: AuthUser | null;
  currentUser: User | null; // Our custom user profile from Firestore
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  refetchCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (authUser: AuthUser) => {
    if (!db) {
      console.error("Firestore not initialized, cannot fetch user profile.");
      setCurrentUser(null);
      return;
    }
    try {
      const usersCollectionRef = collection(db, 'users');
      const q = query(usersCollectionRef, where('email', '==', authUser.email), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
      } else {
        // User exists in Auth, but no profile in 'users' collection. Check if this is the first user.
        const allUsersSnapshot = await getDocs(query(usersCollectionRef, limit(1)));
        
        if (allUsersSnapshot.empty) {
          // This is the first user ever! Let's make them an Admin.
          toast({
            title: 'Bem-vindo, Administrador!',
            description: 'Detectamos que este é o primeiro login. Seu perfil de administrador foi criado automaticamente.',
          });

          const newUserPayload: Omit<User, 'id'> = {
            name: authUser.email?.split('@')[0] || 'Admin',
            email: authUser.email!,
            role: 'Admin' as const,
            status: 'Active' as const,
            unitIds: [],
            avatarUrl: 'https://placehold.co/150x150.png',
            createdAt: serverTimestamp(),
            professionalCouncil: null,
            councilNumber: null,
            specialties: [],
            availability: [],
          };
          
          const newUserDocRef = await addDoc(usersCollectionRef, newUserPayload);
          setCurrentUser({ id: newUserDocRef.id, ...newUserPayload });
        } else {
          toast({
            variant: 'destructive',
            title: 'Perfil não encontrado',
            description: 'Sua conta de login existe, mas não há um perfil de usuário associado. Contate um administrador.',
          });
          if (auth) {
            await signOut(auth);
          }
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
      if (auth) await signOut(auth);
      setCurrentUser(null);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchUserProfile(authUser);
      } else {
        setUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refetchCurrentUser = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

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
      let description = 'Verifique seu e-mail e senha.';
      if (error.code === 'auth/too-many-requests') {
          description = 'Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/network-request-failed') {
          description = 'Erro de rede. Verifique sua conexão com a internet.';
      } else if (error.code !== 'auth/invalid-credential') {
          console.error("Unexpected login error:", error);
      }
      
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: description,
      });

      if (error.code === 'auth/invalid-credential') {
        console.error("Login error: Invalid credential provided.");
      } else {
        console.error("Login error:", error);
      }
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
  
  const updateAvatar = async (file: File) => {
    if (!auth || !db || !storage || !currentUser) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível mudar o avatar.',
      });
      return;
    }

    const storageRef = storage_ref(storage, `avatars/${currentUser.id}`);
    
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, {
        avatarUrl: downloadURL
      });

      setCurrentUser(prevUser => prevUser ? { ...prevUser, avatarUrl: downloadURL } : null);
      toast({
        title: 'Sucesso!',
        description: 'Seu avatar foi atualizado.',
      });
    } catch (error) {
       console.error("Avatar update error:", error);
       toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: 'Não foi possível fazer o upload do avatar. Tente novamente.',
      });
    }
  };

  const updateUserName = async (name: string) => {
    if (!db || !currentUser) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o nome.' });
        return;
    }
    if (name.trim().length < 3) {
        toast({ variant: 'destructive', title: 'Nome inválido', description: 'O nome deve ter pelo menos 3 caracteres.' });
        return;
    }

    const userDocRef = doc(db, 'users', currentUser.id);

    try {
        await updateDoc(userDocRef, { name });
        setCurrentUser(prevUser => prevUser ? { ...prevUser, name } : null);
        toast({ title: 'Sucesso!', description: 'Seu nome foi atualizado.' });
    } catch (error) {
        console.error("User name update error:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o nome no banco de dados.' });
    }
  };


  const value = {
    user,
    currentUser,
    isAuthenticated: !loading && !!user && !!currentUser,
    loading,
    login,
    logout,
    updateAvatar,
    updateUserName,
    refetchCurrentUser,
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

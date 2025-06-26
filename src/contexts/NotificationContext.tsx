'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Notification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!db) {
        setError("A configuração do Firebase está ausente.");
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      setError(null);
      const notificationsCollection = collection(db, 'notifications');
      // Fetch latest 10 notifications for example
      const q = query(notificationsCollection, orderBy('createdAt', 'desc'), limit(10));
      const notificationSnapshot = await getDocs(q);
      const notificationList = notificationSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      setNotifications(notificationList);
    } catch (err: any) {
      console.error("Error fetching notifications: ", err);
      const userFriendlyError = "Falha ao buscar notificações.";
      setError(userFriendlyError);
      setNotifications([]);
      toast({
        variant: "destructive",
        title: "Erro ao buscar notificações",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, loading, error, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

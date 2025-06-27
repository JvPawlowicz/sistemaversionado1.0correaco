'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Notification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

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
  const { currentUser } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!db || !currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const notificationsCollection = collection(db, 'notifications');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(notificationsCollection, where('createdAt', '>=', thirtyDaysAgo), orderBy('createdAt', 'desc'));
      
      const notificationSnapshot = await getDocs(q);
      const allNotifications = notificationSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      const userNotifications = allNotifications.filter(notification => {
          if (notification.seenBy?.includes(currentUser.id)) {
              return false;
          }
          
          switch(notification.targetType) {
              case 'ALL':
                  return true;
              case 'ROLE':
                  return notification.targetValue === currentUser.role;
              case 'UNIT':
                  return Array.isArray(currentUser.unitIds) && currentUser.unitIds.includes(notification.targetValue as string);
              case 'SPECIFIC':
                  return Array.isArray(notification.targetValue) && notification.targetValue.includes(currentUser.id);
              default:
                  return false;
          }
      });
      
      setNotifications(userNotifications.slice(0, 10));
    } catch (err: any) {
      console.error("Error fetching notifications: ", err);
      setError("Falha ao buscar notificações.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

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

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuthContext } from './AuthContext';

export interface Notification {
  id: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  clearNotifications: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

interface NotificationApiResponse {
  id: number;
  usuario_id: number;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!user || user.rol === 'admin') {
      setNotifications([]);
      return;
    }

    const response = await axiosInstance.get<NotificationApiResponse[]>('/api/notificaciones/mis-notificaciones');
    const parsed = response.data.map((item) => ({
      id: item.id,
      message: item.mensaje,
      read: item.leida,
      timestamp: new Date(item.fecha_creacion),
    }));
    setNotifications(parsed);
  }, [user]);

  useEffect(() => {
    refreshNotifications().catch((error) => {
      console.error('Error loading notifications:', error);
    });
  }, [refreshNotifications]);

  useEffect(() => {
    if (!user || user.rol === 'admin') {
      return;
    }

    const id = window.setInterval(() => {
      refreshNotifications().catch((error) => {
        console.error('Error polling notifications:', error);
      });
    }, 10000);

    return () => window.clearInterval(id);
  }, [refreshNotifications, user]);

  const clearNotifications = useCallback(() => {
    axiosInstance.delete('/api/notificaciones/limpiar').catch((error) => {
      console.error('Error clearing notifications:', error);
    });
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: number) => {
    axiosInstance.put(`/api/notificaciones/${id}/leer`).catch((error) => {
      console.error('Error marking notification as read:', error);
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    axiosInstance.put('/api/notificaciones/leer-todas').catch((error) => {
      console.error('Error marking all notifications as read:', error);
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      clearNotifications,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    }),
    [notifications, clearNotifications, markAsRead, markAllAsRead, refreshNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
  }
  return context;
};

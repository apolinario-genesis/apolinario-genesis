import { useState, useEffect } from 'react';
import NotificationService, { Notification } from '../services/NotificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Initialize service
    notificationService.initialize();

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    // Load initial data
    loadNotifications();

    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    const allNotifications = await notificationService.getNotifications();
    const unread = await notificationService.getUnreadCount();
    setNotifications(allNotifications);
    setUnreadCount(unread);
  };

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const clearAll = async () => {
    await notificationService.clearNotifications();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
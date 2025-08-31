import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'love_message' | 'event' | 'spiritual';
  timestamp: Date;
  read: boolean;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    await this.loadNotifications();
  }

  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    await this.saveNotifications();
    this.notifyListeners();

    // Show local notification
    Alert.alert(
      notification.title,
      notification.message,
      [{ text: 'OK', onPress: () => this.markAsRead(newNotification.id) }]
    );
  }

  async getNotifications(): Promise<Notification[]> {
    return this.notifications;
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
    this.notifyListeners();
  }

  async clearNotifications() {
    this.notifications = [];
    await this.saveNotifications();
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async loadNotifications() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private async saveNotifications() {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Utility methods for different types of notifications
  async notifyLoveMessage(senderName: string, message: string) {
    await this.addNotification({
      title: `💕 Mensagem de ${senderName}`,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type: 'love_message',
    });
  }

  async notifyUpcomingEvent(eventTitle: string, timeUntil: string) {
    await this.addNotification({
      title: `📅 ${eventTitle}`,
      message: `Seu evento está chegando! ${timeUntil}`,
      type: 'event',
    });
  }

  async notifyDailyReminder() {
    await this.addNotification({
      title: '🌅 Bom dia!',
      message: 'Que tal registrar como vocês estão se sentindo hoje?',
      type: 'reminder',
    });
  }

  async notifySpiritualContent(title: string, type: string) {
    await this.addNotification({
      title: `🙏 Nova ${type}`,
      message: `Seu parceiro(a) compartilhou: ${title}`,
      type: 'spiritual',
    });
  }
}

export default NotificationService;
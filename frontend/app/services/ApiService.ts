import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

class ApiService {
  private static instance: ApiService;
  private notificationService = NotificationService.getInstance();

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Network error');
    }
    return response.json();
  }

  // Auth methods
  async register(userData: { name: string; email: string; password: string }) {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }

  async getMe() {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async joinCouple(coupleCode: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/join-couple`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ couple_code: coupleCode }),
    });
    return this.handleResponse(response);
  }

  // Love Messages
  async createLoveMessage(messageData: { message: string; message_type: string }) {
    const response = await fetch(`${BACKEND_URL}/api/love-messages`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    const result = await this.handleResponse(response);
    
    // Notify partner
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      await this.notificationService.notifyLoveMessage(user.name, messageData.message);
    }
    
    return result;
  }

  async getLoveMessages() {
    const response = await fetch(`${BACKEND_URL}/api/love-messages`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Events
  async createEvent(eventData: any) {
    const response = await fetch(`${BACKEND_URL}/api/events`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(eventData),
    });
    const result = await this.handleResponse(response);
    
    // Check if it's an upcoming event and set notification
    const eventDate = new Date(eventData.event_date);
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= 7 && daysDiff > 0) {
      const timeUntil = daysDiff === 1 ? 'amanhã' : `em ${daysDiff} dias`;
      await this.notificationService.notifyUpcomingEvent(eventData.title, timeUntil);
    }
    
    return result;
  }

  async getEvents() {
    const response = await fetch(`${BACKEND_URL}/api/events`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Diary Entries
  async createDiaryEntry(entryData: any) {
    const response = await fetch(`${BACKEND_URL}/api/diary-entries`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  async getDiaryEntries() {
    const response = await fetch(`${BACKEND_URL}/api/diary-entries`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Spiritual Content
  async createSpiritualContent(contentData: any) {
    const response = await fetch(`${BACKEND_URL}/api/spiritual-content`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(contentData),
    });
    const result = await this.handleResponse(response);
    
    // Notify partner about new spiritual content
    const typeMap = {
      prayer: 'Oração',
      reflection: 'Reflexão',
      verse_study: 'Estudo Bíblico'
    };
    await this.notificationService.notifySpiritualContent(
      contentData.title, 
      typeMap[contentData.content_type] || 'Conteúdo'
    );
    
    return result;
  }

  async getSpiritualContent(contentType?: string) {
    const url = contentType 
      ? `${BACKEND_URL}/api/spiritual-content?content_type=${contentType}`
      : `${BACKEND_URL}/api/spiritual-content`;
    
    const response = await fetch(url, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

export default ApiService;
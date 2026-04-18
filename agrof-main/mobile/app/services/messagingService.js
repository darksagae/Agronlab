import authService from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 */
class MessagingService {
  constructor() {
    this.localCacheKey = 'agrof_conversations';
    this.conversationSubscription = null;
    this.messageSubscriptions = new Map();
  }

  getCurrentUserId() {
    return authService.getCachedUserId();
  }

  async getOrCreateConversation() {
    return { success: false, error: 'Messaging backend not configured' };
  }

  async getConversations() {
    return this.getLocalConversations();
  }

  async getMessages() {
    return { success: true, messages: [] };
  }

  async sendMessage() {
    return { success: false, error: 'Messaging backend not configured' };
  }

  async markMessagesAsRead() {
    return { success: true };
  }

  async deleteMessage() {
    return { success: false, error: 'Messaging backend not configured' };
  }

  async getUnreadCount() {
    return { success: true, count: 0 };
  }

  subscribeToMessages() {
    return () => {};
  }

  subscribeToConversations() {
    return () => {};
  }

  async getLocalConversations() {
    try {
      const data = await AsyncStorage.getItem(this.localCacheKey);
      const conversations = data ? JSON.parse(data) : [];
      return { success: true, conversations };
    } catch {
      return { success: true, conversations: [] };
    }
  }

  async saveLocalConversations(conversations) {
    try {
      await AsyncStorage.setItem(this.localCacheKey, JSON.stringify(conversations));
    } catch (e) {
      console.warn('AGRON: saveLocalConversations', e?.message);
    }
  }

  cleanup() {
    this.messageSubscriptions.clear();
  }
}

export default new MessagingService();

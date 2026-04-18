import authService from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 */
class NotificationService {
  constructor() {
    this.notificationSubscription = null;
    this.badgeCountKey = 'agrof_notification_badge';
  }

  getCurrentUserId() {
    return authService.getCachedUserId();
  }

  async getNotifications() {
    return { success: true, notifications: [] };
  }

  async getUnreadCount() {
    await AsyncStorage.setItem(this.badgeCountKey, '0');
    return { success: true, count: 0 };
  }

  async markAsRead() {
    return { success: true };
  }

  async markAllAsRead() {
    return { success: true };
  }

  async deleteNotification() {
    return { success: true };
  }

  async clearReadNotifications() {
    return { success: true };
  }

  subscribeToNotifications() {
    return () => {};
  }

  async createNotification() {
    return { success: false, error: 'Notifications backend not configured' };
  }

  async cleanupExpired() {
    return { success: true };
  }

  cleanup() {}
}

export default new NotificationService();

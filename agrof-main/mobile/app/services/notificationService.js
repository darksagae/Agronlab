import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notification Service
 * Handles all in-app notifications
 * 
 * KEY FLOW:
 * 1. Events happen (order update, new message, delivery update)
 * 2. Triggers auto-create notifications
 * 3. User receives real-time notification
 * 4. Notification stored in database (linked by UUID)
 * 5. User can view, mark as read, or delete
 * 
 * UUID CORRELATION:
 * - notifications.user_id = Firebase UID
 * - All notifications for user retrieved via UUID
 * - User logs out/in → All notifications intact
 * - NO DATA LOSS!
 */

class NotificationService {
  constructor() {
    this.notificationSubscription = null;
    this.badgeCountKey = 'agrof_notification_badge';
  }

  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  /**
   * Get all notifications for current user
   * @param {object} options - Filter options
   * @returns {Promise<{success: boolean, notifications: array}>}
   */
  async getNotifications(options = {}) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { 
        unreadOnly = false, 
        limit = 50, 
        type = null,
        priority = null 
      } = options;

      console.log('🔔 Getting notifications for user:', userId);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: notifications, error } = await query;

      if (error) {
        console.error('❌ Error getting notifications:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notifications loaded:', notifications.length);
      return { success: true, notifications };
    } catch (error) {
      console.error('❌ Error in getNotifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<{success: boolean, count: number}>}
   */
  async getUnreadCount() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error getting unread count:', error);
        return { success: false, error: error.message };
      }

      console.log('📨 Unread notifications:', count);
      
      // Cache badge count locally
      await AsyncStorage.setItem(this.badgeCountKey, count.toString());
      
      return { success: true, count };
    } catch (error) {
      console.error('❌ Error in getUnreadCount:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - UUID of the notification
   * @returns {Promise<{success: boolean}>}
   */
  async markAsRead(notificationId) {
    try {
      console.log('👁️ Marking notification as read:', notificationId);

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error marking as read:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification marked as read');
      
      // Update badge count
      await this.getUnreadCount();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error in markAsRead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<{success: boolean}>}
   */
  async markAllAsRead() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('👁️ Marking all notifications as read');

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking all as read:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ All notifications marked as read');
      
      // Update badge count
      await this.getUnreadCount();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - UUID of the notification
   * @returns {Promise<{success: boolean}>}
   */
  async deleteNotification(notificationId) {
    try {
      console.log('🗑️ Deleting notification:', notificationId);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete all read notifications
   * @returns {Promise<{success: boolean}>}
   */
  async clearReadNotifications() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🗑️ Clearing read notifications');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) {
        console.error('❌ Error clearing notifications:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Read notifications cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in clearReadNotifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to real-time notifications
   * @param {function} onNewNotification - Callback when new notification arrives
   * @returns {function} Unsubscribe function
   */
  subscribeToNotifications(onNewNotification) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ Cannot subscribe - user not authenticated');
      return () => {};
    }

    console.log('🔔 Subscribing to notifications for user:', userId);

    this.notificationSubscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 New notification received!', payload.new.type);
          
          if (onNewNotification) {
            onNewNotification(payload.new);
          }
          
          // Update badge count
          this.getUnreadCount();
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from notifications');
      if (this.notificationSubscription) {
        this.notificationSubscription.unsubscribe();
        this.notificationSubscription = null;
      }
    };
  }

  /**
   * Create manual notification (admin function)
   * @param {string} userId - UUID of the user
   * @param {object} notificationData - Notification details
   * @returns {Promise<{success: boolean}>}
   */
  async createNotification(userId, notificationData) {
    try {
      console.log('📝 Creating notification for user:', userId);

      const { type, title, message, priority = 'normal', data = {} } = notificationData;

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          priority
        });

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification created');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in createNotification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup expired notifications
   * @returns {Promise<{success: boolean}>}
   */
  async cleanupExpired() {
    try {
      console.log('🧹 Cleaning up expired notifications...');

      const { error } = await supabase.rpc('delete_expired_notifications');

      if (error) {
        console.error('❌ Error cleaning up notifications:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Expired notifications cleaned');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in cleanupExpired:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
      this.notificationSubscription = null;
    }
  }
}

export default new NotificationService();





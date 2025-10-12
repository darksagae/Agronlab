import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';

/**
 * Activity Log Service
 * Tracks all user actions for audit trail and debugging
 * 
 * KEY PURPOSE:
 * 1. Security - Track all user actions
 * 2. Debugging - Find data issues
 * 3. Analytics - User behavior insights
 * 4. Compliance - Audit trail
 * 
 * UUID CORRELATION:
 * - user_activity_log.user_id = Firebase UID
 * - All actions by user tracked via UUID
 * - User logs out/in → Complete action history
 * - Perfect for debugging "lost data" issues
 */

class ActivityLogService {
  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  /**
   * Log a user action
   * @param {string} action - Action type
   * @param {string} description - Human-readable description
   * @param {object} details - Additional details
   * @param {boolean} success - Whether action succeeded
   * @returns {Promise<{success: boolean}>}
   */
  async logAction(action, description, details = {}, success = true) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ Cannot log action - no user');
        return { success: false };
      }

      console.log('📝 Logging action:', action);

      const { error } = await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action,
          description,
          details,
          success
        });

      if (error) {
        console.error('❌ Error logging activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error in logAction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get activity log for current user
   * @param {object} options - Filter options
   * @returns {Promise<{success: boolean, activities: array}>}
   */
  async getMyActivity(options = {}) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { action = null, limit = 50, errorsOnly = false } = options;

      console.log('📋 Getting activity log for user:', userId);

      let query = supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId);

      if (action) {
        query = query.eq('action', action);
      }

      if (errorsOnly) {
        query = query.eq('success', false);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: activities, error } = await query;

      if (error) {
        console.error('❌ Error getting activity log:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Activity log loaded:', activities.length, 'entries');
      return { success: true, activities };
    } catch (error) {
      console.error('❌ Error in getMyActivity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get activity stats for user
   * @param {string} userId - UUID of the user (optional, defaults to current)
   * @returns {Promise<{success: boolean, stats: object}>}
   */
  async getActivityStats(userId = null) {
    try {
      userId = userId || this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📊 Getting activity stats for user:', userId);

      const { data: activities, error } = await supabase
        .from('user_activity_log')
        .select('action, success, created_at')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error getting activity stats:', error);
        return { success: false, error: error.message };
      }

      // Calculate stats
      const stats = {
        totalActions: activities.length,
        successfulActions: activities.filter(a => a.success).length,
        failedActions: activities.filter(a => !a.success).length,
        actionsByType: {},
        recentActivity: activities.slice(0, 10),
        firstActivity: activities[activities.length - 1]?.created_at,
        lastActivity: activities[0]?.created_at
      };

      // Group by action type
      activities.forEach(a => {
        stats.actionsByType[a.action] = (stats.actionsByType[a.action] || 0) + 1;
      });

      console.log('✅ Activity stats calculated');
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error in getActivityStats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get failed actions (for debugging)
   * @returns {Promise<{success: boolean, failures: array}>}
   */
  async getFailedActions() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🐛 Getting failed actions for user:', userId);

      const { data: failures, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error getting failed actions:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Failed actions loaded:', failures.length);
      return { success: true, failures };
    } catch (error) {
      console.error('❌ Error in getFailedActions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search activity log
   * @param {string} searchTerm - Search in description/action
   * @param {object} dateRange - {start, end}
   * @returns {Promise<{success: boolean, results: array}>}
   */
  async searchActivity(searchTerm, dateRange = {}) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🔍 Searching activity log:', searchTerm);

      let query = supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId);

      // Search in description and action
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`);
      }

      // Date range filter
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end);
      }

      query = query.order('created_at', { ascending: false }).limit(100);

      const { data: results, error } = await query;

      if (error) {
        console.error('❌ Error searching activity:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Search results:', results.length);
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error in searchActivity:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ActivityLogService();





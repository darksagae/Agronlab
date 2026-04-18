import authService from './authService';

class ActivityLogService {
  getCurrentUserId() {
    return authService.getCachedUserId();
  }

  async logAction(action, description, details = {}, success = true) {
    const userId = this.getCurrentUserId();
    if (!userId) return { success: false };
    console.log('📝 [activity]', action, description, details, success);
    return { success: true };
  }

  async getMyActivity() {
    return { success: true, activities: [] };
  }

  async getActivityStats() {
    return { success: true, stats: {} };
  }

  async getFailedActions() {
    return { success: true, failures: [] };
  }

  async searchActivity() {
    return { success: true, activities: [] };
  }
}

export default new ActivityLogService();

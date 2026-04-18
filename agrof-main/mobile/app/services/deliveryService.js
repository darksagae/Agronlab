import authService from './authService';

class DeliveryService {
  getCurrentUserId() {
    return authService.getCachedUserId();
  }

  async createDelivery() {
    return { success: false, error: 'Delivery backend not configured' };
  }

  async getDeliveryForOrder() {
    return { success: false, error: 'No delivery record' };
  }

  async trackDelivery() {
    return { success: false, error: 'Delivery backend not configured' };
  }

  async updateDeliveryStatus() {
    return { success: false, error: 'Delivery backend not configured' };
  }

  async updateDriverLocation() {
    return { success: false, error: 'Delivery backend not configured' };
  }

  async markAsDelivered() {
    return { success: false, error: 'Delivery backend not configured' };
  }

  async getMyDeliveries() {
    return { success: true, deliveries: [] };
  }

  async getProviders() {
    return { success: true, providers: [] };
  }

  subscribeToDelivery() {
    return () => {};
  }
}

export default new DeliveryService();

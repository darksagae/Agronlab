import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
import cartService from './cartService';

const ORDERS_KEY = 'agrof_local_orders';

async function readAllOrders() {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeAllOrders(map) {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(map));
}

/**
 */
class OrderService {
  getCurrentUserId() {
    return authService.getCachedUserId();
  }

  async createOrder(shippingAddress, paymentMethod = 'mobile_money', customerNotes = '') {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📦 Creating local order for user:', userId);

      const cartResult = await cartService.getOrCreateCart();
      if (!cartResult.success || !cartResult.cart) {
        return { success: false, error: 'Cart not found' };
      }

      const cart = cartResult.cart;
      if (!cart.cart_items || cart.cart_items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const orderNumber = `AGR-${Date.now()}`;

      let subtotal = 0;
      const orderItems = cart.cart_items.map((item) => {
        const p = item.products || {};
        subtotal += Number(item.subtotal || 0);
        return {
          id: `oi-${item.id}`,
          product_id: item.product_id,
          seller_id: item.seller_id,
          product_name: p.name || 'Product',
          product_description: p.description,
          product_image: p.images?.[0],
          sku: p.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          total: item.subtotal,
          products: p,
        };
      });

      const order = {
        id: orderId,
        order_number: orderNumber,
        user_id: userId,
        buyer_id: userId,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod,
        subtotal,
        tax: cart.tax || 0,
        shipping_cost: cart.shipping_cost || 0,
        total_amount: subtotal + Number(cart.tax || 0) + Number(cart.shipping_cost || 0),
        currency: 'UGX',
        shipping_address: shippingAddress,
        customer_email: authService.getCachedUserEmail(),
        customer_phone: shippingAddress?.phone,
        customer_notes: customerNotes,
        created_at: new Date().toISOString(),
        order_items: orderItems,
      };

      const all = await readAllOrders();
      const list = Array.isArray(all[userId]) ? all[userId] : [];
      list.unshift(order);
      all[userId] = list;
      await writeAllOrders(all);

      await cartService.clearCart();

      console.log('✅ Order created:', order.order_number);
      return { success: true, order };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrders(status = null, limit = 20) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const all = await readAllOrders();
      let orders = Array.isArray(all[userId]) ? [...all[userId]] : [];
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }
      orders = orders.slice(0, limit);

      console.log('✅ Orders loaded:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrder(orderId) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      const all = await readAllOrders();
      const orders = all[userId] || [];
      const order = orders.find((o) => o.id === orderId || o.order_number === orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, order };
    } catch (error) {
      console.error('❌ Error getting order:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelOrder(orderId, reason = '') {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      const all = await readAllOrders();
      const orders = all[userId] || [];
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx < 0) {
        return { success: false, error: 'Order not found' };
      }
      orders[idx] = {
        ...orders[idx],
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        admin_notes: reason,
      };
      all[userId] = orders;
      await writeAllOrders(all);
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      const all = await readAllOrders();
      const orders = all[userId] || [];
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx < 0) {
        return { success: false, error: 'Order not found' };
      }
      const updateData = { ...orders[idx], status };
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.payment_status = 'paid';
      } else if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
      orders[idx] = updateData;
      all[userId] = orders;
      await writeAllOrders(all);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OrderService();

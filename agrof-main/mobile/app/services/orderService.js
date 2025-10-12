import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';
import cartService from './cartService';

class OrderService {
  // Get current user ID from Firebase
  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  // Create order from cart
  async createOrder(shippingAddress, paymentMethod = 'mobile_money', customerNotes = '') {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📦 Creating order for user:', userId);

      // Get active cart with items
      const cartResult = await cartService.getOrCreateCart();
      if (!cartResult.success || !cartResult.cart) {
        return { success: false, error: 'Cart not found' };
      }

      const cart = cartResult.cart;

      if (!cart.cart_items || cart.cart_items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          buyer_id: userId,
          status: 'pending',
          payment_status: 'pending',
          payment_method: paymentMethod,
          subtotal: cart.subtotal || 0,
          tax: cart.tax || 0,
          shipping_cost: cart.shipping_cost || 0,
          total_amount: cart.total || 0,
          currency: 'UGX',
          shipping_address: shippingAddress,
          customer_email: auth.currentUser?.email,
          customer_phone: shippingAddress.phone,
          customer_notes: customerNotes
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error creating order:', orderError);
        return { success: false, error: orderError.message };
      }

      // Copy cart items to order items
      const orderItems = cart.cart_items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        seller_id: item.seller_id,
        product_name: item.products?.name || 'Unknown Product',
        product_description: item.products?.description,
        product_image: item.products?.images?.[0],
        sku: item.products?.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        total: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        // Rollback order
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: itemsError.message };
      }

      // Mark cart as converted
      await supabase
        .from('carts')
        .update({ status: 'converted' })
        .eq('id', cart.id);

      console.log('✅ Order created:', order.order_number);
      return { success: true, order };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's orders
  async getOrders(status = null, limit = 20) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📋 Getting orders for user:', userId);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              images
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ Error getting orders:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Orders loaded:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Error getting orders:', error);
      return { success: false, error: error.message };
    }
  }

  // Get order by ID
  async getOrder(orderId) {
    try {
      console.log('📦 Getting order:', orderId);

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              *,
              sellers (
                business_name,
                business_address
              )
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ Error getting order:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Order loaded:', order.order_number);
      return { success: true, order };
    } catch (error) {
      console.error('❌ Error getting order:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason = '') {
    try {
      console.log('❌ Cancelling order:', orderId);

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          admin_notes: reason
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error cancelling order:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Order cancelled');
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  }

  // Update order status (for admins/sellers)
  async updateOrderStatus(orderId, status) {
    try {
      console.log('📝 Updating order status:', orderId, status);

      const updateData = { status };

      // Set timestamps based on status
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

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error updating order status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Order status updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OrderService();





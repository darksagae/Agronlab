import { supabase } from '../config/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebaseConfig';

class CartService {
  constructor() {
    this.localCartKey = 'agrof_cart';
  }

  // Get current user ID from Firebase
  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  // Get or create user's active cart
  async getOrCreateCart() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🛒 Getting cart for user:', userId);

      // Try Supabase first
      let { data: cart, error } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            *,
            products (
              id,
              name,
              price,
              images,
              quantity_in_stock,
              seller_id,
              sellers (
                business_name
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Supabase cart error:', error);
        return await this.getLocalCart();
      }

      // Create cart if doesn't exist
      if (!cart) {
        console.log('📝 Creating new cart');
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: userId,
            status: 'active'
          })
          .select()
          .single();

        if (createError) {
          return await this.getLocalCart();
        }

        cart = { ...newCart, cart_items: [] };
      }

      // Cache locally
      await this.saveLocalCart(cart);

      console.log('✅ Cart loaded:', cart.cart_items?.length || 0, 'items');
      return { success: true, cart };
    } catch (error) {
      console.error('❌ Error getting cart:', error);
      return await this.getLocalCart();
    }
  }

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('➕ Adding to cart:', productId, 'qty:', quantity);

      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, seller_id, quantity_in_stock')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }

      // Check stock
      if (product.quantity_in_stock < quantity) {
        return { success: false, error: 'Insufficient stock' };
      }

      // Get or create cart
      const cartResult = await this.getOrCreateCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.cart;

      // Check if item already in cart
      const existingItem = cart.cart_items?.find(item => item.product_id === productId);

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            subtotal: product.price * newQuantity
          })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('❌ Error updating cart item:', updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            seller_id: product.seller_id,
            quantity,
            unit_price: product.price,
            subtotal: product.price * quantity
          });

        if (insertError) {
          console.error('❌ Error adding cart item:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      console.log('✅ Item added to cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove item from cart
  async removeFromCart(cartItemId) {
    try {
      console.log('➖ Removing from cart:', cartItemId);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.error('❌ Error removing cart item:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Item removed from cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Update cart item quantity
  async updateCartItemQuantity(cartItemId, quantity) {
    try {
      console.log('📝 Updating cart item:', cartItemId, 'qty:', quantity);

      // Get cart item to calculate new subtotal
      const { data: cartItem } = await supabase
        .from('cart_items')
        .select('unit_price')
        .eq('id', cartItemId)
        .single();

      if (!cartItem) {
        return { success: false, error: 'Cart item not found' };
      }

      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          subtotal: cartItem.unit_price * quantity
        })
        .eq('id', cartItemId);

      if (error) {
        console.error('❌ Error updating cart item:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Cart item updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating cart item:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cart
  async clearCart() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🗑️ Clearing cart');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .in('cart_id', 
          supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
        );

      if (error) {
        console.error('❌ Error clearing cart:', error);
        return { success: false, error: error.message };
      }

      // Clear local cart
      await AsyncStorage.removeItem(this.localCartKey);

      console.log('✅ Cart cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Local cart fallback
  async getLocalCart() {
    try {
      const cartData = await AsyncStorage.getItem(this.localCartKey);
      const cart = cartData ? JSON.parse(cartData) : { cart_items: [] };
      return { success: true, cart };
    } catch (error) {
      console.error('❌ Error getting local cart:', error);
      return { success: true, cart: { cart_items: [] } };
    }
  }

  async saveLocalCart(cart) {
    try {
      await AsyncStorage.setItem(this.localCartKey, JSON.stringify(cart));
    } catch (error) {
      console.error('❌ Error saving local cart:', error);
    }
  }
}

export default new CartService();





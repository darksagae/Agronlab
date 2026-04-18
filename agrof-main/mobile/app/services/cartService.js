import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
import { productsApi } from './storeApi';

function cartStorageKey(userId) {
  return `agrof_user_cart_${userId}`;
}

function emptyCart(userId) {
  return {
    id: `local-${userId}`,
    user_id: userId,
    status: 'active',
    subtotal: 0,
    tax: 0,
    shipping_cost: 0,
    total: 0,
    cart_items: [],
  };
}

function recalcTotals(cart) {
  let subtotal = 0;
  for (const item of cart.cart_items || []) {
    subtotal += Number(item.subtotal || 0);
  }
  cart.subtotal = subtotal;
  cart.total = subtotal + Number(cart.tax || 0) + Number(cart.shipping_cost || 0);
  return cart;
}

/**
 */
class CartService {
  async _readCart(userId) {
    const raw = await AsyncStorage.getItem(cartStorageKey(userId));
    if (!raw) return emptyCart(userId);
    try {
      const cart = JSON.parse(raw);
      if (!cart.cart_items) cart.cart_items = [];
      return recalcTotals(cart);
    } catch {
      return emptyCart(userId);
    }
  }

  async _writeCart(userId, cart) {
    await AsyncStorage.setItem(cartStorageKey(userId), JSON.stringify(recalcTotals(cart)));
  }

  getCurrentUserId() {
    return authService.getCachedUserId();
  }

  async getOrCreateCart() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      console.log('🛒 Getting local cart for user:', userId);
      const cart = await this._readCart(userId);
      console.log('✅ Cart loaded:', cart.cart_items?.length || 0, 'items');
      return { success: true, cart };
    } catch (error) {
      console.error('❌ Error getting cart:', error);
      return { success: false, error: error.message };
    }
  }

  async addToCart(productId, quantity = 1) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('➕ Adding to cart:', productId, 'qty:', quantity);

      const product = await productsApi.getById(productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const price = Number(product.price ?? product.unit_price ?? 0);
      const stock = product.quantity_in_stock;
      if (stock != null && stock < quantity) {
        return { success: false, error: 'Insufficient stock' };
      }

      const sellerId = product.seller_id ?? product.sellers?.id ?? 'local';
      const cart = await this._readCart(userId);
      const items = cart.cart_items || [];
      const existing = items.find((i) => String(i.product_id) === String(productId));

      const embedded = {
        id: product.id,
        name: product.name,
        price,
        images: product.images || (product.image ? [product.image] : []),
        quantity_in_stock: product.quantity_in_stock,
        seller_id: sellerId,
        sellers: product.sellers || { business_name: product.seller_name || 'Store' },
        description: product.description,
        sku: product.sku,
      };

      if (existing) {
        existing.quantity += quantity;
        existing.unit_price = price;
        existing.subtotal = price * existing.quantity;
        existing.products = embedded;
      } else {
        items.push({
          id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          product_id: productId,
          seller_id: sellerId,
          quantity,
          unit_price: price,
          subtotal: price * quantity,
          products: embedded,
        });
      }

      cart.cart_items = items;
      await this._writeCart(userId, cart);
      console.log('✅ Item added to cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return { success: false, error: error.message };
    }
  }

  async removeFromCart(cartItemId) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      console.log('➖ Removing from cart:', cartItemId);
      const cart = await this._readCart(userId);
      cart.cart_items = (cart.cart_items || []).filter((i) => i.id !== cartItemId);
      await this._writeCart(userId, cart);
      console.log('✅ Item removed from cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCartItemQuantity(cartItemId, quantity) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      console.log('📝 Updating cart item:', cartItemId, 'qty:', quantity);
      const cart = await this._readCart(userId);
      const item = (cart.cart_items || []).find((i) => i.id === cartItemId);
      if (!item) {
        return { success: false, error: 'Cart item not found' };
      }
      item.quantity = quantity;
      item.subtotal = item.unit_price * quantity;
      await this._writeCart(userId, cart);
      console.log('✅ Cart item updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating cart item:', error);
      return { success: false, error: error.message };
    }
  }

  async clearCart() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }
      console.log('🗑️ Clearing cart');
      await AsyncStorage.removeItem(cartStorageKey(userId));
      console.log('✅ Cart cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new CartService();

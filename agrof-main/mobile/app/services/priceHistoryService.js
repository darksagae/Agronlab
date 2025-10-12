import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';

/**
 * Price History Service
 * Tracks all product price changes over time
 * 
 * KEY FEATURES:
 * 1. Auto-log price changes when sellers update prices
 * 2. Show price trends & charts
 * 3. Alert buyers on price drops (auto-notification)
 * 4. Seller price management
 * 
 * UUID CORRELATION:
 * - price_history.changed_by = Firebase UID (seller who changed price)
 * - price_history.seller_id = Firebase UID
 * - Auto-notify users who favorited product
 * - All history preserved by UUID
 */

class PriceHistoryService {
  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  /**
   * Get price history for a product
   * @param {string} productId - UUID of the product
   * @param {number} limit - Number of records to return
   * @returns {Promise<{success: boolean, history: array}>}
   */
  async getProductPriceHistory(productId, limit = 30) {
    try {
      console.log('📊 Getting price history for product:', productId);

      const { data: history, error } = await supabase
        .from('price_history')
        .select(`
          *,
          changed_by_user:users!price_history_changed_by_fkey(full_name),
          seller:sellers(business_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting price history:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Price history loaded:', history.length, 'entries');
      return { success: true, history };
    } catch (error) {
      console.error('❌ Error in getProductPriceHistory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get price trends for analytics
   * @param {string} productId - UUID of the product
   * @returns {Promise<{success: boolean, trends: object}>}
   */
  async getPriceTrends(productId) {
    try {
      console.log('📈 Getting price trends for product:', productId);

      const { data: history, error } = await supabase
        .from('price_history')
        .select('new_price, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error getting price trends:', error);
        return { success: false, error: error.message };
      }

      // Calculate trends
      const prices = history.map(h => h.new_price);
      const dates = history.map(h => h.created_at);
      
      const currentPrice = prices[prices.length - 1];
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const averagePrice = prices.reduce((sum, p) => sum + parseFloat(p), 0) / prices.length;

      const trends = {
        current: currentPrice,
        lowest: lowestPrice,
        highest: highestPrice,
        average: averagePrice.toFixed(2),
        totalChanges: history.length,
        priceData: history.map(h => ({
          price: parseFloat(h.new_price),
          date: h.created_at
        }))
      };

      console.log('✅ Price trends calculated');
      return { success: true, trends };
    } catch (error) {
      console.error('❌ Error in getPriceTrends:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update product price (seller function)
   * @param {string} productId - UUID of the product (from Supabase products table)
   * @param {number} newPrice - New price
   * @param {object} changeDetails - {reason, notes, isPromotion, promotionEndDate}
   * @returns {Promise<{success: boolean}>}
   */
  async updateProductPrice(productId, newPrice, changeDetails = {}) {
    try {
      const sellerId = this.getCurrentUserId();
      if (!sellerId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('💰 Updating price for product:', productId, 'to', newPrice);

      const { reason = 'manual_update', notes = '', isPromotion = false, promotionEndDate = null } = changeDetails;

      // Get current product price
      const { data: product } = await supabase
        .from('products')
        .select('price, seller_id')
        .eq('id', productId)
        .single();

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Verify seller owns this product
      if (product.seller_id !== sellerId) {
        return { success: false, error: 'You can only update prices for your own products' };
      }

      // Update product price (trigger will auto-log to price_history)
      const { error: updateError } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', productId);

      if (updateError) {
        console.error('❌ Error updating price:', updateError);
        return { success: false, error: updateError.message };
      }

      // Update the price history record with additional details
      const { error: historyError } = await supabase
        .from('price_history')
        .update({
          change_reason: reason,
          notes,
          is_promotion: isPromotion,
          promotion_end_date: promotionEndDate
        })
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('✅ Product price updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updateProductPrice:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get products with recent price drops
   * @param {number} limit - Number of products
   * @returns {Promise<{success: boolean, products: array}>}
   */
  async getRecentPriceDrops(limit = 10) {
    try {
      console.log('📉 Getting recent price drops...');

      const { data: priceDrops, error } = await supabase
        .from('price_history')
        .select(`
          *,
          product:products(id, name, images, price, category_id)
        `)
        .lt('price_change', 0) // Negative change = price drop
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting price drops:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Price drops loaded:', priceDrops.length);
      return { success: true, priceDrops };
    } catch (error) {
      console.error('❌ Error in getRecentPriceDrops:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get price change stats for seller dashboard
   * @param {string} sellerId - UUID of the seller
   * @returns {Promise<{success: boolean, stats: object}>}
   */
  async getSellerPriceStats(sellerId) {
    try {
      console.log('📊 Getting price stats for seller:', sellerId);

      const { data: changes, error } = await supabase
        .from('price_history')
        .select('price_change, change_reason, created_at')
        .eq('seller_id', sellerId);

      if (error) {
        console.error('❌ Error getting seller stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        totalChanges: changes.length,
        priceIncreases: changes.filter(c => c.price_change > 0).length,
        priceDecreases: changes.filter(c => c.price_change < 0).length,
        averageChange: changes.reduce((sum, c) => sum + parseFloat(c.price_change), 0) / changes.length,
        changesByReason: {}
      };

      // Group by reason
      changes.forEach(c => {
        stats.changesByReason[c.change_reason] = (stats.changesByReason[c.change_reason] || 0) + 1;
      });

      console.log('✅ Price stats calculated');
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error in getSellerPriceStats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PriceHistoryService();





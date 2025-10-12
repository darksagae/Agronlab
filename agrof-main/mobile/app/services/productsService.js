import { supabase } from '../config/supabaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Products Service
 * Fetches products, categories, and store data from Supabase
 * Replaces the old storeApi.js that connected to SQLite backend
 */

class ProductsService {
  constructor() {
    this.cacheKey = 'agrof_products_cache';
    this.categoriesKey = 'agrof_categories_cache';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      console.log('📂 Fetching categories from Supabase...');

      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_name');

      if (error) {
        console.error('❌ Error fetching categories:', error);
        return await this.getCachedCategories();
      }

      console.log('✅ Categories loaded:', categories.length);
      await this.cacheCategories(categories);
      return { success: true, categories };
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return await this.getCachedCategories();
    }
  }

  /**
   * Get all active products
   */
  async getProducts(options = {}) {
    try {
      const {
        category = null,
        limit = 100,
        offset = 0,
        searchQuery = null,
        featured = null
      } = options;

      console.log('🛍️ Fetching products from Supabase...');

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            display_name
          ),
          sellers (
            id,
            business_name,
            store_logo,
            rating
          )
        `)
        .eq('is_active', true);

      // Filter by category
      if (category) {
        query = query.eq('category_id', category);
      }

      // Filter featured products
      if (featured !== null) {
        query = query.eq('is_featured', featured);
      }

      // Search by name
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data: products, error } = await query;

      if (error) {
        console.error('❌ Error fetching products:', error);
        return await this.getCachedProducts();
      }

      console.log('✅ Products loaded:', products.length);
      await this.cacheProducts(products);
      return { success: true, products };
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return await this.getCachedProducts();
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 6) {
    return await this.getProducts({ featured: true, limit });
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    try {
      console.log('🔍 Fetching product:', productId);

      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            display_name
          ),
          sellers (
            id,
            business_name,
            store_logo,
            store_description,
            rating,
            total_sales
          ),
          product_reviews (
            id,
            rating,
            review,
            title,
            created_at,
            users (
              id,
              full_name,
              profile_photo
            )
          )
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('❌ Error fetching product:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Product loaded:', product.name);
      return { success: true, product };
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId, limit = 20) {
    return await this.getProducts({ category: categoryId, limit });
  }

  /**
   * Search products
   */
  async searchProducts(query, limit = 20) {
    return await this.getProducts({ searchQuery: query, limit });
  }

  /**
   * Get products by seller
   */
  async getProductsBySeller(sellerId, limit = 20) {
    try {
      console.log('🏪 Fetching products for seller:', sellerId);

      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            display_name
          )
        `)
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching seller products:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Seller products loaded:', products.length);
      return { success: true, products };
    } catch (error) {
      console.error('❌ Error fetching seller products:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cache products locally
   */
  async cacheProducts(products) {
    try {
      const cacheData = {
        products,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error caching products:', error);
    }
  }

  /**
   * Get cached products
   */
  async getCachedProducts() {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const { products, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheDuration) {
          console.log('📦 Using cached products:', products.length);
          return { success: true, products, fromCache: true };
        }
      }
      console.log('⚠️ No valid cached products');
      return { success: false, products: [], fromCache: true };
    } catch (error) {
      console.error('❌ Error getting cached products:', error);
      return { success: false, products: [], fromCache: true };
    }
  }

  /**
   * Cache categories locally
   */
  async cacheCategories(categories) {
    try {
      const cacheData = {
        categories,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.categoriesKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error caching categories:', error);
    }
  }

  /**
   * Get cached categories
   */
  async getCachedCategories() {
    try {
      const cached = await AsyncStorage.getItem(this.categoriesKey);
      if (cached) {
        const { categories, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheDuration) {
          console.log('📦 Using cached categories:', categories.length);
          return { success: true, categories, fromCache: true };
        }
      }
      console.log('⚠️ No valid cached categories');
      return { success: false, categories: [], fromCache: true };
    } catch (error) {
      console.error('❌ Error getting cached categories:', error);
      return { success: false, categories: [], fromCache: true };
    }
  }

  /**
   * Clear all caches
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
      await AsyncStorage.removeItem(this.categoriesKey);
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

export default new ProductsService();





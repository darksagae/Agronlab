import AsyncStorage from '@react-native-async-storage/async-storage';
import { productsApi, categoriesApi } from './storeApi';

/**
 */
class ProductsService {
  constructor() {
    this.cacheKey = 'agrof_products_cache';
    this.categoriesKey = 'agrof_categories_cache';
    this.cacheDuration = 5 * 60 * 1000;
  }

  _normalizeProduct(p) {
    if (!p) return p;
    const cat = p.categories;
    const categoryName = p.category_name || p.category || cat?.display_name || cat?.name;
    return {
      ...p,
      is_active: p.is_active !== false,
      categories: Array.isArray(cat)
        ? cat
        : categoryName
          ? { id: p.category_id, name: categoryName, display_name: categoryName }
          : p.categories,
      sellers: p.sellers || {
        id: p.seller_id,
        business_name: p.seller_name || p.business_name || 'Store',
        store_logo: p.store_logo,
        rating: p.rating,
        total_sales: p.total_sales,
      },
    };
  }

  async getCategories() {
    try {
      console.log('📂 Fetching categories (store API / S3)...');
      const categories = await categoriesApi.getAll('en');
      const list = Array.isArray(categories) ? categories : [];
      await this.cacheCategories(list);
      return { success: true, categories: list };
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return await this.getCachedCategories();
    }
  }

  async getProducts(options = {}) {
    try {
      const {
        category = null,
        limit = 100,
        offset = 0,
        searchQuery = null,
        featured = null,
      } = options;

      console.log('🛍️ Fetching products (store API / S3)...');

      let products;
      if (searchQuery) {
        products = await productsApi.search(searchQuery, 'en');
      } else if (featured) {
        products = await productsApi.getFeatured({ limit: limit || 20, language: 'en' });
      } else {
        products = await productsApi.getAll({
          category: category || undefined,
          limit,
          language: 'en',
        });
      }

      let list = Array.isArray(products) ? products.map((p) => this._normalizeProduct(p)) : [];
      if (offset > 0) {
        list = list.slice(offset, offset + limit);
      } else if (list.length > limit) {
        list = list.slice(0, limit);
      }

      await this.cacheProducts(list);
      return { success: true, products: list };
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return await this.getCachedProducts();
    }
  }

  async getFeaturedProducts(limit = 6) {
    return await this.getProducts({ featured: true, limit });
  }

  async getProduct(productId) {
    try {
      console.log('🔍 Fetching product:', productId);
      const product = await productsApi.getById(productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return { success: true, product: this._normalizeProduct(product) };
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      return { success: false, error: error.message };
    }
  }

  async getProductsByCategory(categoryId, limit = 20) {
    return await this.getProducts({ category: categoryId, limit });
  }

  async searchProducts(query, limit = 20) {
    return await this.getProducts({ searchQuery: query, limit });
  }

  async getProductsBySeller(sellerId, limit = 20) {
    try {
      console.log('🏪 Fetching products for seller (local filter):', sellerId);
      const { success, products } = await this.getProducts({ limit: 200 });
      if (!success || !products) {
        return { success: true, products: [] };
      }
      const filtered = products
        .filter(
          (p) =>
            String(p.seller_id) === String(sellerId) ||
            String(p.sellers?.id) === String(sellerId)
        )
        .slice(0, limit);
      return { success: true, products: filtered };
    } catch (error) {
      console.error('❌ Error fetching seller products:', error);
      return { success: false, error: error.message };
    }
  }

  async cacheProducts(products) {
    try {
      const cacheData = { products, timestamp: Date.now() };
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error caching products:', error);
    }
  }

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

  async cacheCategories(categories) {
    try {
      const cacheData = { categories, timestamp: Date.now() };
      await AsyncStorage.setItem(this.categoriesKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error caching categories:', error);
    }
  }

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

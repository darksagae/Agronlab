// AGRON Store — catalog JSON on S3 first (light app), then legacy HTTP, then bundled fallback.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchCatalogJsonFromS3,
  enrichProductsWithResolvedImages,
} from './s3CatalogService';
import { getFallbackCatalog } from '../data/catalogFallback';
import { 
  STORE_API_URL, 
  CACHE_DURATION, 
  API_TIMEOUT, 
  findWorkingApiEndpoint,
  getCurrentApiConfig,
  API_CONFIG 
} from '../config/apiConfig';

// Store API base URL — portal URL when configured, else LAN discovery fallback
let API_BASE_URL = API_CONFIG.STORE.API_URL;
let currentApiUrl = API_BASE_URL;
let endpointTested = false;

// Cache management
const cache = new Map();

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Test API connectivity
const testApiConnection = async (baseUrl) => {
  try {
    console.log(`🔍 Testing API connection to: ${baseUrl}/health`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const isOk = response.ok;
    console.log(`📊 API test result for ${baseUrl}: ${isOk ? 'SUCCESS ✅' : 'FAILED ❌'} (status: ${response.status})`);
    return isOk;
  } catch (error) {
    console.log(`❌ API test error for ${baseUrl}:`, error.message);
    return false;
  }
};

// Health check (optional LAN store — catalog may come from S3 only)
export const healthCheck = async () => {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(t);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health:', data);
      return data;
    }

    return { status: 'ERROR', message: 'Backend not responding' };
  } catch (error) {
    const msg =
      error.name === 'AbortError' ? 'Network request timed out' : error.message;
    console.warn('🏥 Store backend health skipped (offline or no LAN server):', msg);
    return { status: 'OFFLINE', message: msg };
  }
};

// Categories API
export const categoriesApi = {
  getAll: async (language = 'en') => {
    const cacheKey = `categories_${language}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('📦 Using cached categories:', cached.length);
      return cached;
    }
    
    try {
      const s3 = await fetchCatalogJsonFromS3();
      if (s3?.categories?.length) {
        console.log('📂 Categories from S3 catalog.json:', s3.categories.length);
        setCachedData(cacheKey, s3.categories);
        return s3.categories;
      }

      console.log('📂 Fetching categories from backend...');
      console.log('   URL:', `${API_BASE_URL}/categories?language=${language}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(`${API_BASE_URL}/categories?language=${language}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const categories = await response.json();
      console.log('✅ Categories loaded from backend:', categories.length);
      
      setCachedData(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      const fb = getFallbackCatalog();
      return fb.categories || [];
    }
  }
};

// Products API
export const productsApi = {
  getAll: async (options = {}) => {
    const { limit = 100, language = 'en', category = null } = options;
    const cacheKey = `products_${language}_${category || 'all'}_${limit}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('📦 Using cached products:', cached.length);
      return cached;
    }
    
    try {
      const s3 = await fetchCatalogJsonFromS3();
      if (s3?.products?.length) {
        let list = [...s3.products];
        if (category) {
          list = list.filter(
            (p) => p.category_name === category || p.category === category
          );
        }
        if (limit && list.length > limit) {
          list = list.slice(0, limit);
        }
        list = await enrichProductsWithResolvedImages(list);
        console.log('🛍️ Products from S3 catalog.json:', list.length);
        setCachedData(cacheKey, list);
        return list;
      }

      let url = `${API_BASE_URL}/products?language=${language}&limit=${limit}`;
      if (category) {
        url += `&category=${category}`;
      }
      
      console.log('🛍️ Fetching products from backend...');
      console.log('   URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const products = await response.json();
      console.log('✅ Products loaded from backend:', products.length);
      
      setCachedData(cacheKey, products);
      return products;
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      const fb = getFallbackCatalog();
      let list = fb.products || [];
      if (category) {
        list = list.filter(
          (p) => p.category_name === category || p.category === category
        );
      }
      if (limit && list.length > limit) list = list.slice(0, limit);
      return list;
    }
  },
  
  getFeatured: async (options = {}) => {
    const { limit = 6, language = 'en' } = options;
    console.log('⭐ Fetching featured products...');
    // Get all products and filter featured ones
    const products = await productsApi.getAll({ limit: 20, language });
    return products.slice(0, limit);
  },
  
  getByCategory: async (categoryName, language = 'en') => {
    console.log('📂 Fetching products by category:', categoryName);
    return await productsApi.getAll({ category: categoryName, language, limit: 100 });
  },
  
  search: async (query, language = 'en') => {
    try {
      console.log('🔍 Searching products:', query);
      const s3 = await fetchCatalogJsonFromS3();
      if (s3?.products?.length) {
        const q = (query || '').toLowerCase();
        const filtered = s3.products.filter((p) =>
          (p.name || '').toLowerCase().includes(q)
        );
        return enrichProductsWithResolvedImages(filtered);
      }
      const url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&language=${language}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const products = await response.json();
        console.log('✅ Search results:', products.length);
        return products;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      console.log('🔍 Fetching product by ID:', id);
      const s3 = await fetchCatalogJsonFromS3();
      if (s3?.products?.length) {
        const found = s3.products.find(
          (p) => String(p.id) === String(id)
        );
        if (found) {
          const [one] = await enrichProductsWithResolvedImages([found]);
          return one;
        }
      }
      const url = `${API_BASE_URL}/products/${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const product = await response.json();
        console.log('✅ Product loaded:', product.name);
        return product;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch product:', error);
      return null;
    }
  }
};

// Direct exports for backward compatibility
export const getCategories = categoriesApi.getAll;
export const getProducts = productsApi.getAll;
export const getFeaturedProducts = productsApi.getFeatured;
export const getProduct = productsApi.getById;
export const getProductsByCategory = productsApi.getByCategory;
export const searchProducts = productsApi.search;

// Cart API (simple AsyncStorage list — cartService uses per-user rich cart)
export const cartApi = {
  getItems: async () => {
    try {
      console.log('🛒 Getting cart items from AsyncStorage...');
      const cartData = await AsyncStorage.getItem('agrof_cart');
      const items = cartData ? JSON.parse(cartData) : [];
      console.log('✅ Cart items loaded:', items.length);
      return items;
    } catch (error) {
      console.error('❌ Error getting cart items:', error);
      return [];
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      console.log('➕ Adding to cart:', productId);
      const items = await cartApi.getItems();
      
      // Check if item already in cart
      const existingIndex = items.findIndex(item => item.product_id === productId);
      
      if (existingIndex >= 0) {
        // Update quantity
        items[existingIndex].quantity += quantity;
      } else {
        // Add new item
        items.push({
          id: Date.now().toString(),
          product_id: productId,
          quantity
        });
      }
      
      await AsyncStorage.setItem('agrof_cart', JSON.stringify(items));
      console.log('✅ Item added to cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return { success: false, error: error.message };
    }
  },

  removeItem: async (itemId) => {
    try {
      console.log('➖ Removing from cart:', itemId);
      const items = await cartApi.getItems();
      const filtered = items.filter(item => item.id !== itemId);
      await AsyncStorage.setItem('agrof_cart', JSON.stringify(filtered));
      console.log('✅ Item removed from cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      return { success: false, error: error.message };
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      console.log('📝 Updating cart quantity:', itemId, quantity);
      const items = await cartApi.getItems();
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        items[itemIndex].quantity = quantity;
        await AsyncStorage.setItem('agrof_cart', JSON.stringify(items));
        console.log('✅ Quantity updated');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      return { success: false, error: error.message };
    }
  },

  clear: async () => {
    try {
      console.log('🗑️ Clearing cart');
      await AsyncStorage.removeItem('agrof_cart');
      console.log('✅ Cart cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return { success: false, error: error.message };
    }
  }
};

// Default export
export default {
  healthCheck,
  categoriesApi,
  productsApi,
  cartApi,
  getCategories,
  getProducts,
  getFeaturedProducts,
  getProduct,
  getProductsByCategory,
  searchProducts
};

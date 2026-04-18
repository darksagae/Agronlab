import { productsApi, categoriesApi, healthCheck } from './storeApi';
import { STORE_BASE_URL, AI_BASE_URL, AI_TIMEOUT } from '../config/apiConfig';

/**
 * Advanced Product Service for AGRON Store
 * Handles comprehensive product fetching, training data preparation, and AI integration
 */
class AdvancedProductService {
  constructor() {
    this.apiUrl = STORE_BASE_URL; // Store backend URL
    this.aiUrl = AI_BASE_URL; // AI backend URL
    this.productCache = new Map();
    this.trainingData = [];
    this.isTraining = false;
  }

  /**
   * Fetch all products with complete information
   * @returns {Promise<Object>} Complete product data
   */
  async fetchAllProducts() {
    try {
      console.log('🔄 Fetching all products with complete information...');
      
      // Check store backend health
      const health = await healthCheck();
      if (health.status !== 'OK') {
        throw new Error('Store backend is not available');
      }

      // Fetch all categories first
      const categories = await categoriesApi.getAll();
      console.log(`📂 Found ${categories.length} categories`);

      // Fetch all products from each category
      const allProducts = [];
      for (const category of categories) {
        try {
          const categoryProducts = await productsApi.getAll({ 
            category: category.name,
            limit: 1000 // Get all products from category
          });
          
          // Enhance products with category information and proper image URLs
          const enhancedProducts = categoryProducts.map(product => {
            let imageUrl = null;
            if (product.image_url) {
              // If image_url already has http, use it directly
              if (product.image_url.startsWith('http')) {
                imageUrl = product.image_url;
              } else {
                // Otherwise, prepend store backend URL
                imageUrl = `${this.apiUrl}${product.image_url}`;
              }
            } else {
              // Try to construct image URL from product data
              imageUrl = `${this.apiUrl}/api/images/${category.name.toUpperCase()}/${encodeURIComponent(product.name)}/image.jpg`;
            }
            
            return {
              ...product,
              category_display_name: category.display_name,
              category_description: category.description,
              full_image_url: imageUrl,
              image_url: imageUrl
            };
          });
          
          allProducts.push(...enhancedProducts);
          console.log(`📦 Fetched ${categoryProducts.length} products from ${category.name}`);
        } catch (error) {
          console.warn(`⚠️ Failed to fetch products from ${category.name}:`, error.message);
        }
      }

      // Also fetch products without category filter
      try {
        const generalProducts = await productsApi.getAll({ limit: 1000 });
        const newProducts = generalProducts.filter(product => 
          !allProducts.some(existing => existing.id === product.id)
        );
        
        // Enhance general products with proper image URLs
        const enhancedGeneralProducts = newProducts.map(product => {
          let imageUrl = null;
          if (product.image_url) {
            if (product.image_url.startsWith('http')) {
              imageUrl = product.image_url;
            } else {
              imageUrl = `${this.apiUrl}${product.image_url}`;
            }
          } else {
            // Try to construct image URL
            imageUrl = `${this.apiUrl}/api/images/GENERAL/${encodeURIComponent(product.name)}/image.jpg`;
          }
          
          return {
            ...product,
            full_image_url: imageUrl,
            image_url: imageUrl
          };
        });
        
        allProducts.push(...enhancedGeneralProducts);
        console.log(`📦 Added ${enhancedGeneralProducts.length} additional products`);
      } catch (error) {
        console.warn('⚠️ Failed to fetch general products:', error.message);
      }

      console.log(`✅ Total products fetched: ${allProducts.length}`);
      
      // Cache the results
      this.productCache.set('all_products', allProducts);
      this.productCache.set('last_fetch', Date.now());

      return {
        success: true,
        products: allProducts,
        total: allProducts.length,
        categories: categories.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to fetch all products:', error);
      return {
        success: false,
        error: error.message,
        products: [],
        total: 0
      };
    }
  }

  /**
   * Get products with complete information for training
   * @param {string} diseaseType - Disease type for training
   * @returns {Promise<Object>} Training data
   */
  async getTrainingProducts(diseaseType = '') {
    try {
      console.log(`🧠 Preparing training data for disease: ${diseaseType}`);
      
      // Fetch all products if not cached
      let allProducts = this.productCache.get('all_products');
      if (!allProducts || this.isCacheExpired()) {
        const fetchResult = await this.fetchAllProducts();
        if (!fetchResult.success) {
          throw new Error(fetchResult.error);
        }
        allProducts = fetchResult.products;
      }

      // Filter and score products for training
      const trainingProducts = allProducts.map(product => {
        const score = this.calculateTrainingScore(product, diseaseType);
        return {
          ...product,
          training_score: score,
          is_relevant: score > 0
        };
      }).filter(product => product.is_relevant);

      // Sort by training score
      trainingProducts.sort((a, b) => b.training_score - a.training_score);

      // Ensure we have at least 2 products
      if (trainingProducts.length < 2) {
        console.log('⚠️ Not enough relevant products, adding general products...');
        // Add general products to ensure minimum count
        const generalProducts = allProducts
          .filter(product => !trainingProducts.some(tp => tp.id === product.id))
          .slice(0, 2 - trainingProducts.length);
        
        trainingProducts.push(...generalProducts);
      }

      console.log(`🎯 Found ${trainingProducts.length} relevant products for training`);

      return {
        success: true,
        training_products: trainingProducts,
        total_products: allProducts.length,
        disease_type: diseaseType,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to prepare training data:', error);
      return {
        success: false,
        error: error.message,
        training_products: []
      };
    }
  }

  /**
   * Calculate training score for a product
   * @param {Object} product - Product data
   * @param {string} diseaseType - Disease type
   * @returns {number} Training score
   */
  calculateTrainingScore(product, diseaseType) {
    let score = 0;
    const productText = `${product.name} ${product.description || ''} ${product.features || ''} ${product.usage_instructions || ''}`.toLowerCase();
    const diseaseLower = diseaseType.toLowerCase();

    // Disease name match in product name (highest priority)
    if (product.name.toLowerCase().includes(diseaseLower)) {
      score += 20;
    }

    // Disease name match in description
    if (product.description && product.description.toLowerCase().includes(diseaseLower)) {
      score += 15;
    }

    // Disease name match in features
    if (product.features && product.features.toLowerCase().includes(diseaseLower)) {
      score += 10;
    }

    // Disease name match in usage instructions
    if (product.usage_instructions && product.usage_instructions.toLowerCase().includes(diseaseLower)) {
      score += 8;
    }

    // Treatment-related keywords
    const treatmentKeywords = [
      'fungicide', 'herbicide', 'pesticide', 'treatment', 'control', 'prevent', 'cure',
      'disease', 'infection', 'bacterial', 'fungal', 'viral', 'pest', 'insect',
      'organic', 'chemical', 'spray', 'powder', 'liquid', 'granular'
    ];

    treatmentKeywords.forEach(keyword => {
      if (productText.includes(keyword)) {
        score += 3;
      }
    });

    // Category-based scoring
    const categoryScores = {
      'fungicides': 15,
      'herbicides': 12,
      'organic_chemicals': 10,
      'fertilizers': 8,
      'pesticides': 15,
      'plant_protection': 12
    };

    if (product.category_name && categoryScores[product.category_name]) {
      score += categoryScores[product.category_name];
    }

    return score;
  }

  /**
   * Start advanced training with Python backend
   * @param {string} diseaseType - Disease type to train for
   * @returns {Promise<Object>} Training result
   */
  async startAdvancedTraining(diseaseType) {
    try {
      console.log(`🚀 Starting advanced training for: ${diseaseType}`);
      this.isTraining = true;

      // Get training products
      const trainingData = await this.getTrainingProducts(diseaseType);
      if (!trainingData.success) {
        throw new Error(trainingData.error);
      }

      // Prepare training payload
      const trainingPayload = {
        disease_type: diseaseType,
        products: trainingData.training_products,
        total_products: trainingData.total_products,
        timestamp: new Date().toISOString(),
        training_mode: 'advanced'
      };

      // Send to Python backend for training
      const response = await fetch(`${this.aiUrl}/api/train-advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingPayload)
      });

      if (!response.ok) {
        throw new Error(`Training request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Advanced training completed successfully');
        this.trainingData.push({
          disease_type: diseaseType,
          training_id: result.training_id,
          products_used: trainingData.training_products.length,
          timestamp: new Date().toISOString()
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Advanced training failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Get enhanced product recommendations using trained model
   * @param {string} diseaseType - Disease type
   * @param {Array} symptoms - Symptoms array
   * @returns {Promise<Object>} Enhanced recommendations
   */
  async getEnhancedRecommendations(diseaseType, symptoms = []) {
    try {
      console.log(`🎯 Getting enhanced recommendations for: ${diseaseType}`);

      // Get training products
      const trainingData = await this.getTrainingProducts(diseaseType);
      if (!trainingData.success) {
        throw new Error(trainingData.error);
      }

      // Use trained model for recommendations
      const recommendationPayload = {
        disease_type: diseaseType,
        symptoms: symptoms,
        products: trainingData.training_products,
        model_type: 'advanced_trained'
      };

      const response = await fetch(`${this.aiUrl}/api/recommend-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recommendationPayload)
      });

      if (!response.ok) {
        throw new Error(`Recommendation request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Enhanced recommendations: ${result.recommendations.length} products`);
        return {
          success: true,
          recommendations: result.recommendations,
          disease_type: diseaseType,
          symptoms: symptoms,
          model_confidence: result.confidence || 0.8,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Failed to get enhanced recommendations');
      }

    } catch (error) {
      console.error('❌ Enhanced recommendations failed:', error);
      // Fallback to basic recommendations
      return await this.getBasicRecommendations(diseaseType, symptoms);
    }
  }

  /**
   * Get basic product recommendations (fallback)
   * @param {string} diseaseType - Disease type
   * @param {Array} symptoms - Symptoms array
   * @returns {Promise<Object>} Basic recommendations
   */
  async getBasicRecommendations(diseaseType, symptoms = []) {
    try {
      const trainingData = await this.getTrainingProducts(diseaseType);
      if (!trainingData.success) {
        throw new Error(trainingData.error);
      }

      // Return at least 2 products, maximum 6
      let recommendations = trainingData.training_products.slice(0, 6);
      
      console.log(`📊 Training data products: ${trainingData.training_products.length}`);
      console.log(`📊 Initial recommendations: ${recommendations.length}`);
      
      // Ensure we have at least 2 products
      if (recommendations.length < 2) {
        console.log('⚠️ Not enough products in training data, fetching more...');
        // Try to get more products from the store
        try {
          const additionalProducts = await productsApi.getAll({ limit: 20 });
          console.log(`📦 Fetched ${additionalProducts.length} additional products`);
          
          const newProducts = additionalProducts
            .filter(product => !recommendations.some(rec => rec.id === product.id))
            .slice(0, 4 - recommendations.length); // Get enough to reach at least 2
          
          console.log(`📦 Adding ${newProducts.length} new products`);
          
          // Enhance new products with image URLs
          const enhancedNewProducts = newProducts.map(product => {
            let imageUrl = null;
            if (product.image_url) {
              if (product.image_url.startsWith('http')) {
                imageUrl = product.image_url;
              } else {
                imageUrl = `${this.apiUrl}${product.image_url}`;
              }
            } else {
              imageUrl = `${this.apiUrl}/api/images/GENERAL/${encodeURIComponent(product.name)}/image.jpg`;
            }
            
            return {
              ...product,
              full_image_url: imageUrl,
              image_url: imageUrl,
              basic_score: 1, // Basic score for fallback products
              training_score: 1
            };
          });
          
          recommendations.push(...enhancedNewProducts);
          console.log(`📊 Final recommendations: ${recommendations.length}`);
        } catch (error) {
          console.warn('⚠️ Failed to fetch additional products:', error.message);
        }
      }
      
      // Final check - if we still don't have enough, use any available products
      if (recommendations.length < 2) {
        console.log('🆘 Emergency: Still not enough products, using any available...');
        try {
          const emergencyProducts = await productsApi.getAll({ limit: 6 });
          recommendations = emergencyProducts.slice(0, 6);
          console.log(`🆘 Emergency products: ${recommendations.length}`);
        } catch (emergencyError) {
          console.error('❌ Emergency fallback failed:', emergencyError);
        }
      }

      return {
        success: true,
        recommendations: recommendations,
        disease_type: diseaseType,
        symptoms: symptoms,
        model_confidence: 0.6,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Basic recommendations failed:', error);
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  /**
   * Check if cache is expired
   * @returns {boolean} True if cache is expired
   */
  isCacheExpired() {
    const lastFetch = this.productCache.get('last_fetch');
    if (!lastFetch) return true;
    
    const now = Date.now();
    const cacheAge = now - lastFetch;
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    return cacheAge > cacheExpiry;
  }

  /**
   * Get training history
   * @returns {Array} Training history
   */
  getTrainingHistory() {
    return this.trainingData;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.productCache.clear();
    console.log('🗑️ Product cache cleared');
  }
}

// Export singleton instance
export default new AdvancedProductService();

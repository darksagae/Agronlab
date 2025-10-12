/**
 * AI Command Service for AGROF
 * Receives AI commands and fetches specific products from store
 * Highly trained to pick the right products based on disease analysis
 */

import { productsApi, categoriesApi } from './storeApi';
import { AI_BASE_URL, STORE_BASE_URL, AI_TIMEOUT } from '../config/apiConfig';

class AICommandService {
  constructor() {
    this.apiUrl = AI_BASE_URL; // AI backend URL
    this.storeUrl = STORE_BASE_URL; // Store backend URL
    this.commandHistory = [];
    this.productCache = new Map();
  }

  /**
   * Process AI command and fetch specific products
   * @param {Object} aiCommand - AI command from backend
   * @returns {Promise<Object>} Fetched products result
   */
  async processAICommand(aiCommand) {
    try {
      console.log('🤖 Processing AI Command:', aiCommand);
      
      const {
        action,
        disease_type,
        symptoms,
        categories,
        products,
        treatment_priority,
        search_strategy,
        confidence
      } = aiCommand;

      if (action !== 'fetch_products') {
        throw new Error('Invalid AI command action');
      }

      let fetchedProducts = [];

      // Strategy 1: Disease-specific product fetching
      if (search_strategy === 'disease_specific') {
        fetchedProducts = await this.fetchDiseaseSpecificProducts(
          disease_type, 
          categories, 
          products, 
          treatment_priority
        );
      }
      // Strategy 2: Symptom-based product fetching
      else if (search_strategy === 'symptom_based') {
        fetchedProducts = await this.fetchSymptomBasedProducts(
          symptoms, 
          categories, 
          products
        );
      }
      // Strategy 3: Fallback general products
      else {
        fetchedProducts = await this.fetchFallbackProducts();
      }

      // Enhance products with AI intelligence
      const enhancedProducts = this.enhanceProductsWithAI(
        fetchedProducts, 
        aiCommand
      );

      // Store command in history
      this.commandHistory.push({
        command: aiCommand,
        products: enhancedProducts,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ AI Command processed: ${enhancedProducts.length} products fetched`);
      
      return {
        success: true,
        products: enhancedProducts,
        command: aiCommand,
        confidence: confidence,
        strategy: search_strategy
      };

    } catch (error) {
      console.error('❌ AI Command processing failed:', error);
      return {
        success: false,
        error: error.message,
        products: [],
        command: aiCommand
      };
    }
  }

  /**
   * Fetch disease-specific products
   */
  async fetchDiseaseSpecificProducts(diseaseType, categories, products, priority) {
    console.log(`🎯 Fetching disease-specific products for: ${diseaseType}`);
    
    const fetchedProducts = [];
    
    // Fetch by specific product names first (highest priority)
    for (const productName of products) {
      try {
        const searchResults = await productsApi.search(productName);
        const matchingProducts = searchResults.filter(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        fetchedProducts.push(...matchingProducts);
        console.log(`📦 Found ${matchingProducts.length} products for "${productName}"`);
      } catch (error) {
        console.warn(`⚠️ Failed to search for "${productName}":`, error.message);
      }
    }
    
    // Fetch by categories
    for (const category of categories) {
      try {
        const categoryProducts = await productsApi.getAll({ 
          category: category, 
          limit: 10 
        });
        fetchedProducts.push(...categoryProducts);
        console.log(`📂 Found ${categoryProducts.length} products in ${category} category`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${category} products:`, error.message);
      }
    }
    
    // Remove duplicates and sort by priority
    const uniqueProducts = this.removeDuplicates(fetchedProducts);
    const sortedProducts = this.sortByPriority(uniqueProducts, priority);
    
    return sortedProducts.slice(0, 6); // Return top 6 products
  }

  /**
   * Fetch symptom-based products
   */
  async fetchSymptomBasedProducts(symptoms, categories, products) {
    console.log(`🔍 Fetching symptom-based products for symptoms:`, symptoms);
    
    const fetchedProducts = [];
    const symptomQuery = symptoms.join(' ');
    
    // Search by symptoms
    try {
      const symptomResults = await productsApi.search(symptomQuery);
      fetchedProducts.push(...symptomResults);
      console.log(`🔍 Found ${symptomResults.length} products for symptoms`);
    } catch (error) {
      console.warn('⚠️ Symptom search failed:', error.message);
    }
    
    // Search by categories
    for (const category of categories) {
      try {
        const categoryProducts = await productsApi.getAll({ 
          category: category, 
          limit: 5 
        });
        fetchedProducts.push(...categoryProducts);
        console.log(`📂 Found ${categoryProducts.length} products in ${category}`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${category}:`, error.message);
      }
    }
    
    // Search by specific products
    for (const productName of products) {
      try {
        const productResults = await productsApi.search(productName);
        fetchedProducts.push(...productResults);
        console.log(`📦 Found ${productResults.length} products for "${productName}"`);
      } catch (error) {
        console.warn(`⚠️ Failed to search "${productName}":`, error.message);
      }
    }
    
    const uniqueProducts = this.removeDuplicates(fetchedProducts);
    return uniqueProducts.slice(0, 6);
  }

  /**
   * Fetch fallback products when AI analysis fails
   */
  async fetchFallbackProducts() {
    console.log('🆘 Fetching fallback products...');
    
    try {
      // Get general products from multiple categories
      const fallbackCategories = ['fertilizers', 'organic_chemicals', 'fungicides'];
      const fallbackProducts = [];
      
      for (const category of fallbackCategories) {
        try {
          const products = await productsApi.getAll({ 
            category: category, 
            limit: 3 
          });
          fallbackProducts.push(...products);
        } catch (error) {
          console.warn(`⚠️ Failed to fetch ${category}:`, error.message);
        }
      }
      
      // If still no products, get any available products
      if (fallbackProducts.length === 0) {
        const anyProducts = await productsApi.getAll({ limit: 6 });
        fallbackProducts.push(...anyProducts);
      }
      
      console.log(`🆘 Fallback products: ${fallbackProducts.length}`);
      return fallbackProducts.slice(0, 6);
      
    } catch (error) {
      console.error('❌ Fallback product fetching failed:', error);
      return [];
    }
  }

  /**
   * Enhance products with AI intelligence
   */
  enhanceProductsWithAI(products, aiCommand) {
    return products.map(product => {
      // Calculate AI relevance score
      const relevanceScore = this.calculateAIRelevanceScore(product, aiCommand);
      
      // Add AI intelligence data
      return {
        ...product,
        ai_relevance_score: relevanceScore,
        ai_confidence: aiCommand.confidence || 0.8,
        ai_strategy: aiCommand.search_strategy || 'unknown',
        ai_treatment_priority: aiCommand.treatment_priority || 3,
        ai_effectiveness: aiCommand.effectiveness || 0.7,
        enhanced_by_ai: true,
        image_url: this.constructImageUrl(product),
        full_image_url: this.constructImageUrl(product)
      };
    }).sort((a, b) => b.ai_relevance_score - a.ai_relevance_score);
  }

  /**
   * Calculate AI relevance score for product
   */
  calculateAIRelevanceScore(product, aiCommand) {
    let score = 0;
    const productText = `${product.name} ${product.description || ''}`.toLowerCase();
    
    // Disease name match (highest priority)
    if (aiCommand.disease_type && aiCommand.disease_type !== 'Unknown') {
      if (productText.includes(aiCommand.disease_type.toLowerCase())) {
        score += 20;
      }
    }
    
    // Symptom match
    if (aiCommand.symptoms && aiCommand.symptoms.length > 0) {
      aiCommand.symptoms.forEach(symptom => {
        if (productText.includes(symptom.toLowerCase())) {
          score += 5;
        }
      });
    }
    
    // Category match
    if (aiCommand.categories && aiCommand.categories.length > 0) {
      if (aiCommand.categories.includes(product.category_name)) {
        score += 15;
      }
    }
    
    // Product name match
    if (aiCommand.products && aiCommand.products.length > 0) {
      aiCommand.products.forEach(targetProduct => {
        if (product.name.toLowerCase().includes(targetProduct.toLowerCase())) {
          score += 25;
        }
      });
    }
    
    // Treatment keywords
    const treatmentKeywords = [
      'fungicide', 'herbicide', 'pesticide', 'bactericide', 'insecticide',
      'treatment', 'control', 'prevent', 'cure', 'organic', 'natural'
    ];
    
    treatmentKeywords.forEach(keyword => {
      if (productText.includes(keyword)) {
        score += 3;
      }
    });
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Remove duplicate products
   */
  removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
      const key = product.id || product.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort products by priority
   */
  sortByPriority(products, priority) {
    return products.sort((a, b) => {
      // Sort by AI relevance score first
      const scoreA = a.ai_relevance_score || 0;
      const scoreB = b.ai_relevance_score || 0;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // Then by treatment priority
      return (a.treatment_priority || 3) - (b.treatment_priority || 3);
    });
  }

  /**
   * Construct proper image URL with fallback to local assets
   */
  constructImageUrl(product) {
    // If we have a valid HTTP URL, use it
    if (product.image_url && product.image_url.startsWith('http')) {
      return product.image_url;
    }
    
    if (product.full_image_url && product.full_image_url.startsWith('http')) {
      return product.full_image_url;
    }
    
    // Construct image URL based on assets/store/category/product.png structure
    if (product.category_name && product.name) {
      const category = product.category_name.toLowerCase();
      const productName = product.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      const imageUrl = `${this.storeUrl}/api/images/${category}/${productName}.png`;
      console.log('🖼️ Constructed store image URL:', imageUrl);
      return imageUrl;
    }
    
    // For local development, prefer local assets over constructed URLs
    // This prevents connection errors when store backend is not running
    console.log('🖼️ Using local asset fallback for:', product.name);
    return null; // Will trigger fallback to local assets in component
  }

  /**
   * Get command history
   */
  getCommandHistory() {
    return this.commandHistory;
  }

  /**
   * Clear command history
   */
  clearCommandHistory() {
    this.commandHistory = [];
  }
}

// Export singleton instance
export default new AICommandService();

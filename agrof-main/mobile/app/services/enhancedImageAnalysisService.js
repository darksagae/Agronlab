/**
 * Enhanced Image Analysis Service for AGROF
 * Multi-model AI integration with AGROF store products
 */

import { AI_BASE_URL } from '../config/apiConfig';

const API_URL = AI_BASE_URL || 'http://192.168.1.15:5000';

class EnhancedImageAnalysisService {
  constructor() {
    this.apiUrl = API_URL;
    this.analysisCache = new Map();
  }

  /**
   * Enhanced disease analysis using multiple AI models
   * @param {string} imageUri - Image URI or base64 data
   * @param {string} cropType - Optional crop type
   * @param {Array} models - AI models to use ['gemini', 'tensorflow', 'pytorch', 'vision']
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeDiseaseEnhanced(imageUri, cropType = '', models = ['all']) {
    try {
      console.log('🔍 Starting enhanced disease analysis...');
      
      // Check cache first
      const cacheKey = `${imageUri}_${cropType}_${models.join(',')}`;
      if (this.analysisCache.has(cacheKey)) {
        console.log('📋 Using cached analysis results');
        return this.analysisCache.get(cacheKey);
      }

      // Prepare form data
      const formData = new FormData();
      
      // Convert image URI to blob if needed
      const imageBlob = await this.uriToBlob(imageUri);
      formData.append('image', imageBlob, 'disease_image.jpg');
      
      if (cropType) {
        formData.append('crop_type', cropType);
      }
      
      if (models.length > 0 && models[0] !== 'all') {
        formData.append('models', models.join(','));
      }

      // Make API request
      const response = await fetch(`${this.apiUrl}/api/analyze-enhanced`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Cache the result
        this.analysisCache.set(cacheKey, result);
        
        console.log('✅ Enhanced analysis completed successfully');
        return {
          success: true,
          analysis: result.analysis,
          treatments: result.treatments,
          recommendations: result.recommendations,
          timestamp: result.timestamp,
          aiModels: result.analysis.ai_models_used
        };
      } else {
        throw new Error(result.message || 'Analysis failed');
      }

    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
      return {
        success: false,
        error: error.message,
        analysis: {
          disease_type: 'Unknown',
          severity_level: 'Unknown',
          confidence: 0.0,
          crop_type: 'Unknown',
          symptoms: ['Analysis failed'],
          prevention: ['Consult agricultural experts']
        },
        treatments: {
          agrof_products: [],
          total_products: 0
        },
        recommendations: {
          immediate_actions: ['Try again with a clearer image'],
          prevention: ['Regular monitoring recommended'],
          follow_up: ['Re-analyze when conditions improve']
        }
      };
    }
  }

  /**
   * Legacy disease analysis (backward compatibility)
   * @param {string} imageUri - Image URI
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeDiseaseLegacy(imageUri) {
    try {
      console.log('🔍 Starting legacy disease analysis...');
      
      const formData = new FormData();
      const imageBlob = await this.uriToBlob(imageUri);
      formData.append('image', imageBlob, 'disease_image.jpg');

      const response = await fetch(`${this.apiUrl}/api/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('✅ Legacy analysis completed successfully');
        return {
          success: true,
          analysis: result.analysis,
          businessInsights: result.business_insights,
          timestamp: result.timestamp
        };
      } else {
        throw new Error(result.message || 'Analysis failed');
      }

    } catch (error) {
      console.error('❌ Legacy analysis failed:', error);
      return {
        success: false,
        error: error.message,
        analysis: {
          health_status: 'unknown',
          disease_type: 'Unknown',
          severity_level: 'Unknown',
          symptoms: ['Analysis failed'],
          recommendations: ['Consult agricultural experts'],
          confidence: 0.0
        }
      };
    }
  }

  /**
   * Get AGROF store products for disease treatment
   * @param {string} disease - Disease name
   * @returns {Promise<Object>} Store products
   */
  async getStoreProducts(disease = '') {
    try {
      console.log(`🛒 Getting AGROF store products for: ${disease}`);
      
      const url = disease 
        ? `${this.apiUrl}/api/store-products?disease=${encodeURIComponent(disease)}`
        : `${this.apiUrl}/api/store-products`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log(`✅ Found ${result.total} store products`);
        return {
          success: true,
          products: result.products,
          total: result.total,
          disease: result.disease
        };
      } else {
        throw new Error(result.message || 'Failed to get store products');
      }

    } catch (error) {
      console.error('❌ Failed to get store products:', error);
      return {
        success: false,
        error: error.message,
        products: [],
        total: 0
      };
    }
  }

  /**
   * Get available disease treatments from AGROF store
   * @returns {Promise<Object>} Disease treatments
   */
  async getDiseaseTreatments() {
    try {
      console.log('🔬 Getting AGROF disease treatments...');
      
      const response = await fetch(`${this.apiUrl}/api/disease-treatments`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log(`✅ Found ${result.total_diseases} disease treatments`);
        return {
          success: true,
          diseaseTreatments: result.disease_treatments,
          totalDiseases: result.total_diseases
        };
      } else {
        throw new Error(result.message || 'Failed to get disease treatments');
      }

    } catch (error) {
      console.error('❌ Failed to get disease treatments:', error);
      return {
        success: false,
        error: error.message,
        diseaseTreatments: {},
        totalDiseases: 0
      };
    }
  }

  /**
   * Get AI models status
   * @returns {Promise<Object>} AI models status
   */
  async getAIModelsStatus() {
    try {
      console.log('🤖 Getting AI models status...');
      
      const response = await fetch(`${this.apiUrl}/api/ai-models`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('✅ AI models status retrieved');
        return {
          success: true,
          models: result.models,
          storeData: result.store_data
        };
      } else {
        throw new Error(result.message || 'Failed to get AI models status');
      }

    } catch (error) {
      console.error('❌ Failed to get AI models status:', error);
      return {
        success: false,
        error: error.message,
        models: {},
        storeData: {}
      };
    }
  }

  /**
   * Test connection to enhanced backend
   * @returns {Promise<Object>} Connection status
   */
  async testConnection() {
    try {
      console.log('🔗 Testing connection to enhanced backend...');
      
      const response = await fetch(`${this.apiUrl}/api/connection-test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('✅ Connection test successful');
        return {
          success: true,
          message: result.message,
          aiStatus: result.ai_status,
          availableEndpoints: result.available_endpoints
        };
      } else {
        throw new Error(result.message || 'Connection test failed');
      }

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Connection failed'
      };
    }
  }

  /**
   * Convert image URI to blob
   * @param {string} uri - Image URI
   * @returns {Promise<Blob>} Image blob
   */
  async uriToBlob(uri) {
    try {
      if (uri.startsWith('data:')) {
        // Handle base64 data URI
        const response = await fetch(uri);
        return await response.blob();
      } else if (uri.startsWith('file://') || uri.startsWith('content://')) {
        // Handle file URI
        const response = await fetch(uri);
        return await response.blob();
      } else {
        // Handle network URI
        const response = await fetch(uri);
        return await response.blob();
      }
    } catch (error) {
      console.error('Error converting URI to blob:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    console.log('🗑️ Analysis cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.analysisCache.size,
      keys: Array.from(this.analysisCache.keys())
    };
  }
}

// Export singleton instance
export default new EnhancedImageAnalysisService();

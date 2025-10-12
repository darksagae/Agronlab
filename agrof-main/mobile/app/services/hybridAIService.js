/**
 * Hybrid AI Service for Disease Detection
 * Simple wrapper for disease analysis
 */

import { analyzeImageWithProperMethod } from './properImageAnalysisService';

class HybridAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Hybrid AI Service initialized');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Hybrid AI initialization failed:', error);
      return false;
    }
  }

  async analyzeDisease(imageUri) {
    try {
      console.log('🔍 Analyzing disease with Gemini AI...');
      console.log('📸 Image URI:', imageUri);
      
      // Add timeout to Gemini API call
      const analysisPromise = analyzeImageWithProperMethod(imageUri);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API timeout (30s)')), 30000)
      );
      
      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      console.log('✅ Gemini analysis complete');
      console.log('📊 Result:', result);
      
      return {
        ...result,
        analysisMethod: 'gemini',
        timestamp: new Date().toISOString(),
        source: 'Gemini AI'
      };
    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      console.error('📋 Error details:', error.message);
      
      // Return a user-friendly error instead of crashing
      return {
        disease_type: 'Analysis Failed',
        crop_type: 'Unknown',
        health_status: 'unknown',
        severity_level: 'unknown',
        confidence: 0,
        recommendations: [
          'Unable to analyze image at this time',
          'Please check your internet connection',
          'Try taking a clearer photo',
          'Make sure the plant is well-lit'
        ],
        error: error.message,
        analysisMethod: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      ready: this.isInitialized
    };
  }

  dispose() {
    console.log('🧹 Hybrid AI Service cleaned up');
  }
}

// Create singleton instance
const hybridAIService = new HybridAIService();

// Auto-initialize
hybridAIService.initialize().catch(error => {
  console.error('❌ Auto-initialization failed:', error);
});

export default hybridAIService;
export { HybridAIService };


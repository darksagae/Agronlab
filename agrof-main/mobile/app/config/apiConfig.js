/**
 * AGROF API Configuration
 * Centralized configuration for all API endpoints
 * Uses single consistent address: 192.168.0.107
 */

// Base IP addresses for all services - with fallbacks
const BASE_IPS = [
  '192.168.1.15',  // Current WiFi IP - UPDATED Oct 11, 2025
  '10.0.0.1',      // VPN interface (wg0)
  '192.168.0.108', // Previous WiFi IP
  '192.168.0.113', // Older WiFi IP
  '127.0.0.1',     // Localhost fallback
  '10.0.2.2',      // Android emulator host
  'localhost'      // Local fallback
];

// Get the current base IP (will be dynamically determined)
let BASE_IP = '192.168.1.15';  // WiFi IP - your phone can reach this!

// API Configuration
export const API_CONFIG = {
  // Store Backend API
  STORE: {
    BASE_URL: `http://${BASE_IP}:3001`,
    API_URL: `http://${BASE_IP}:3001/api`,
    ENDPOINTS: {
      PRODUCTS: '/products',
      CATEGORIES: '/categories',
      CART: '/cart',
      SEARCH: '/search',
      HEALTH: '/health',
      IMAGES: '/images'
    }
  },
  
  // AI Backend API
  AI: {
    BASE_URL: `http://${BASE_IP}:5000`,
    API_URL: `http://${BASE_IP}:5000/api`,
    ENDPOINTS: {
      ANALYZE_DISEASE: '/ai-analyze-disease',
      HEALTH: '/health'
    }
  }
};

// Timeout Configuration
export const TIMEOUT_CONFIG = {
  API_REQUEST: 30000, // 30 seconds (increased for network latency)
  AI_ANALYSIS: 30000, // 30 seconds for AI analysis
  IMAGE_LOAD: 10000 // 10 seconds for image loading
};

// Cache Configuration
export const CACHE_CONFIG = {
  DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100 // Maximum number of cached items
};

// Network Configuration
export const NETWORK_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  OFFLINE_FALLBACK: true
};

// Export individual configurations for easy access
export const STORE_API_URL = API_CONFIG.STORE.API_URL;
export const AI_API_URL = API_CONFIG.AI.API_URL;
export const STORE_BASE_URL = API_CONFIG.STORE.BASE_URL;
export const AI_BASE_URL = API_CONFIG.AI.BASE_URL;

// Export timeout values
export const API_TIMEOUT = TIMEOUT_CONFIG.API_REQUEST;
export const AI_TIMEOUT = TIMEOUT_CONFIG.AI_ANALYSIS;
export const IMAGE_TIMEOUT = TIMEOUT_CONFIG.IMAGE_LOAD;

// Export cache duration
export const CACHE_DURATION = CACHE_CONFIG.DURATION;

// Export network settings
export const RETRY_ATTEMPTS = NETWORK_CONFIG.RETRY_ATTEMPTS;
export const RETRY_DELAY = NETWORK_CONFIG.RETRY_DELAY;
export const OFFLINE_FALLBACK = NETWORK_CONFIG.OFFLINE_FALLBACK;

// Helper function to get full API URL
export const getApiUrl = (service, endpoint) => {
  const config = API_CONFIG[service.toUpperCase()];
  if (!config) {
    throw new Error(`Unknown service: ${service}`);
  }
  return `${config.API_URL}${endpoint}`;
};

// Helper function to get store API URL
export const getStoreApiUrl = (endpoint) => {
  return getApiUrl('STORE', endpoint);
};

// Helper function to get AI API URL
export const getAiApiUrl = (endpoint) => {
  return getApiUrl('AI', endpoint);
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  return `${API_CONFIG.STORE.BASE_URL}${imagePath}`;
};

// Function to test API connectivity and find working endpoint
export const findWorkingApiEndpoint = async () => {
  console.log('🔍 Testing API endpoints for connectivity...');
  
  for (const ip of BASE_IPS) {
    try {
      console.log(`🌐 Testing endpoint: http://${ip}:3001/api/health`);
      
      const response = await fetch(`http://${ip}:3001/api/health`, {
        method: 'GET',
        timeout: 3000, // 3 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          console.log(`✅ Found working API endpoint: http://${ip}:3001`);
          BASE_IP = ip;
          
          // Update API_CONFIG with working IP
          API_CONFIG.STORE.BASE_URL = `http://${ip}:3001`;
          API_CONFIG.STORE.API_URL = `http://${ip}:3001/api`;
          API_CONFIG.AI.BASE_URL = `http://${ip}:5000`;
          API_CONFIG.AI.API_URL = `http://${ip}:5000/api`;
          
          return ip;
        }
      }
    } catch (error) {
      console.log(`❌ Failed to connect to http://${ip}:3001 - ${error.message}`);
    }
  }
  
  console.log('⚠️ No working API endpoint found, using default configuration');
  return null;
};

// Function to get current working API configuration
export const getCurrentApiConfig = () => {
  return {
    baseIp: BASE_IP,
    storeUrl: API_CONFIG.STORE.API_URL,
    aiUrl: API_CONFIG.AI.API_URL,
    availableIps: BASE_IPS
  };
};

// Export default configuration
export default {
  API_CONFIG,
  TIMEOUT_CONFIG,
  CACHE_CONFIG,
  NETWORK_CONFIG,
  getApiUrl,
  getStoreApiUrl,
  getAiApiUrl,
  getImageUrl
};
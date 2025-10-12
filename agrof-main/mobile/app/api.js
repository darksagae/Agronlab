import Constants from 'expo-constants';

// Get API URL from environment or use default
const BASE_URL = Constants.expoConfig?.extra?.API_URL || 'http://192.168.0.107:5000';

/**
 * Send image to API for disease detection
 * @param {string} uri - Image URI (file:// or data:)
 * @param {string} language - Language code (en, lg, rn)
 * @returns {Promise<Object>} - Prediction result
 */
export async function sendImage(uri, language = 'en') {
  try {
    console.log('📤 Sending image to API:', BASE_URL);
    
    // Create form data
    const formData = new FormData();
    
    // Get file name from URI
    const fileName = uri.split('/').pop() || 'image.jpg';
    
    // Append image file with compression settings
    formData.append('image', {
      uri: uri,
      name: fileName,
      type: 'image/jpeg'
    });
    
    // Append stakeholder type (default to farmers)
    formData.append('stakeholder', 'farmers');
    
    // Make API request to the correct endpoint
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
      timeout: 20000 // 20 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ API Response received:', result.status);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Analysis failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ API Error:', error);
    throw new Error(`Failed to send image: ${error.message}`);
  }
}

/**
 * Check API health status
 * @returns {Promise<Object>} - Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Health check error:', error);
    throw new Error(`Health check failed: ${error.message}`);
  }
}

/**
 * Get model information
 * @returns {Promise<Object>} - Model info
 */
export async function getModelInfo() {
  try {
    const response = await fetch(`${BASE_URL}/api/model/info`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to get model info');
    }
    
    return result.model_info;
    
  } catch (error) {
    console.error('Model info error:', error);
    throw new Error(`Failed to get model info: ${error.message}`);
  }
}

/**
 * Get list of supported diseases
 * @returns {Promise<Array>} - List of diseases
 */
export async function getDiseases() {
  try {
    const response = await fetch(`${BASE_URL}/api/diseases`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to get diseases');
    }
    
    return result.diseases;
    
  } catch (error) {
    console.error('Diseases error:', error);
    throw new Error(`Failed to get diseases: ${error.message}`);
  }
}

/**
 * Test API connection
 * @returns {Promise<boolean>} - Connection status
 */
export async function testConnection() {
  try {
    const health = await checkHealth();
    return health.status === 'healthy' && health.model_loaded;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Get API configuration
 * @returns {Object} - API configuration
 */
export function getApiConfig() {
  return {
    baseUrl: BASE_URL,
    timeout: 20000, // Reduced from 30 to 20 seconds
    maxRetries: 3,
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise<any>} - Function result
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * Send image with retry logic
 * @param {string} uri - Image URI
 * @param {string} language - Language code
 * @returns {Promise<Object>} - Prediction result
 */
export async function sendImageWithRetry(uri, language = 'en') {
  return retryWithBackoff(() => sendImage(uri, language));
}

// Export API URL for debugging
export { BASE_URL };

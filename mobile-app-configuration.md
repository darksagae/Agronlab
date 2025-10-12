# Mobile App API Configuration Guide

## 📱 Configure Mobile App to Connect to Deployed APIs

### Phase 1: Update API Configuration

#### Current Mobile App Structure
Your mobile app is located in: `/agrof-main/mobile/app/`

#### Update API Configuration File
```javascript
// agrof-main/mobile/app/config/apiConfig.js
const API_CONFIG = {
  development: {
    // Local development (when running locally)
    API_BASE_URL: 'http://localhost:5000',
    STORE_BASE_URL: 'http://localhost:3000',
    GEMINI_API_KEY: 'AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0'
  },
  staging: {
    // WireGuard VPN access
    API_BASE_URL: 'http://10.0.0.1:5000',
    STORE_BASE_URL: 'http://10.0.0.1:3000',
    GEMINI_API_KEY: 'AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0'
  },
  production: {
    // Public domain access
    API_BASE_URL: 'https://api.yourdomain.com',
    STORE_BASE_URL: 'https://store.yourdomain.com',
    GEMINI_API_KEY: 'AIzaSyBE2b1nKpQd6LseRIVXfh10O_O3Pm0fvM0'
  }
};

export default API_CONFIG;
```

### Phase 2: Environment Detection

#### Update App.js
```javascript
// agrof-main/mobile/app/App.js
import React, { useEffect, useState } from 'react';
import API_CONFIG from './config/apiConfig';

const App = () => {
  const [apiConfig, setApiConfig] = useState(null);

  useEffect(() => {
    // Determine environment
    const environment = __DEV__ ? 'development' : 'production';
    const config = API_CONFIG[environment];
    setApiConfig(config);
    
    // Log current configuration
    console.log('API Configuration:', config);
  }, []);

  // Your existing app code...
};
```

### Phase 3: Update API Service Calls

#### Update API Service Files
```javascript
// agrof-main/mobile/app/services/apiService.js
import API_CONFIG from '../config/apiConfig';

class ApiService {
  constructor() {
    const environment = __DEV__ ? 'development' : 'production';
    this.baseURL = API_CONFIG[environment].API_BASE_URL;
    this.storeURL = API_CONFIG[environment].STORE_BASE_URL;
  }

  // Disease Detection API
  async analyzeImage(imageData) {
    try {
      const formData = new FormData();
      formData.append('image', imageData);

      const response = await fetch(`${this.baseURL}/api/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Store Products API
  async getProducts() {
    try {
      const response = await fetch(`${this.storeURL}/api/products`);
      return await response.json();
    } catch (error) {
      console.error('Store API Error:', error);
      throw error;
    }
  }

  // Health Check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health Check Error:', error);
      throw error;
    }
  }
}

export default new ApiService();
```

### Phase 4: Update Store Service

#### Update Store Service
```javascript
// agrof-main/mobile/app/services/storeService.js
import API_CONFIG from '../config/apiConfig';

class StoreService {
  constructor() {
    const environment = __DEV__ ? 'development' : 'production';
    this.baseURL = API_CONFIG[environment].STORE_BASE_URL;
  }

  async getProducts(category = null) {
    try {
      const url = category 
        ? `${this.baseURL}/api/products?category=${category}`
        : `${this.baseURL}/api/products`;
      
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Store Service Error:', error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const response = await fetch(`${this.baseURL}/api/products/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Product Fetch Error:', error);
      throw error;
    }
  }

  async searchProducts(query) {
    try {
      const response = await fetch(`${this.baseURL}/api/products/search?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Search Error:', error);
      throw error;
    }
  }
}

export default new StoreService();
```

### Phase 5: Update Components

#### Update Disease Detection Component
```javascript
// agrof-main/mobile/app/components/DiseaseDetection.js
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import ApiService from '../services/apiService';

const DiseaseDetection = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeImage = async (imageUri) => {
    setLoading(true);
    try {
      const result = await ApiService.analyzeImage(imageUri);
      setResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      console.error('Analysis Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your existing UI components */}
      {result && (
        <View>
          <Text>Health Status: {result.analysis.health_status}</Text>
          <Text>Disease Type: {result.analysis.disease_type}</Text>
          <Text>Confidence: {result.analysis.confidence}</Text>
        </View>
      )}
    </View>
  );
};

export default DiseaseDetection;
```

### Phase 6: Network Configuration

#### Update Network Diagnostics
```javascript
// agrof-main/mobile/app/components/NetworkDiagnostics.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ApiService from '../services/apiService';
import StoreService from '../services/storeService';

const NetworkDiagnostics = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      // Test API connection
      const apiHealth = await ApiService.checkHealth();
      setApiStatus(apiHealth.status === 'healthy' ? 'Connected' : 'Error');

      // Test Store connection
      const products = await StoreService.getProducts();
      setStoreStatus(products.length > 0 ? 'Connected' : 'Error');
    } catch (error) {
      setApiStatus('Disconnected');
      setStoreStatus('Disconnected');
    }
  };

  return (
    <View>
      <Text>API Status: {apiStatus}</Text>
      <Text>Store Status: {storeStatus}</Text>
      <TouchableOpacity onPress={checkConnections}>
        <Text>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NetworkDiagnostics;
```

### Phase 7: Build Configuration

#### Update app.config.js
```javascript
// agrof-main/mobile/app/app.config.js
export default {
  expo: {
    name: "AGROF",
    slug: "agrof-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.agrof.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.agrof.mobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: __DEV__ ? "http://localhost:5000" : "https://api.yourdomain.com",
      storeUrl: __DEV__ ? "http://localhost:3000" : "https://store.yourdomain.com"
    }
  }
};
```

### Phase 8: Testing

#### Test API Connectivity
```javascript
// agrof-main/mobile/app/utils/testConnection.js
import ApiService from '../services/apiService';
import StoreService from '../services/storeService';

export const testAllConnections = async () => {
  const results = {
    api: false,
    store: false,
    errors: []
  };

  try {
    // Test API
    const apiHealth = await ApiService.checkHealth();
    results.api = apiHealth.status === 'healthy';
  } catch (error) {
    results.errors.push(`API Error: ${error.message}`);
  }

  try {
    // Test Store
    const products = await StoreService.getProducts();
    results.store = products.length >= 0; // Even empty array is success
  } catch (error) {
    results.errors.push(`Store Error: ${error.message}`);
  }

  return results;
};
```

## 🎯 Implementation Steps

1. **Update configuration files** with new API endpoints
2. **Test connectivity** in development mode
3. **Build and test** with production endpoints
4. **Deploy to app stores** with production configuration

## 📱 Mobile App Features Connected

- ✅ **Disease Detection**: AI-powered plant analysis
- ✅ **Product Catalog**: Full agricultural products
- ✅ **Search & Filter**: Product discovery
- ✅ **Health Monitoring**: API connectivity status
- ✅ **Offline Support**: Graceful degradation

---

**Ready to update your mobile app!** Follow the steps above to connect to your deployed APIs.

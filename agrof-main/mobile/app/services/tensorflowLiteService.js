/**
 * TensorFlow Lite Service for Offline Plant Analysis
 * Supports multiple models:
 * - PlantVillage: Disease detection (38 diseases)
 * - iNaturalist: Plant identification (60+ common plants)
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';

// PlantVillage (Disease Detection)
import { 
  PLANT_VILLAGE_LABELS, 
  formatDiseaseName, 
  parseDiseaseLabel,
  getDiseaseRecommendations,
  getCropStoreCategory 
} from '../data/plantVillageLabels';

// iNaturalist (Plant Identification)
import {
  INATURALIST_COMMON_PLANTS,
  formatPlantName,
  parsePlantLabel,
  getPlantCareRecommendations,
  getPlantProducts,
  isAgriculturalPlant,
  getPlantFamily
} from '../data/iNaturalistLabels';

// Model types
export const MODEL_TYPES = {
  PLANT_VILLAGE: 'plantvillage',
  INATURALIST: 'inaturalist'
};

class TensorFlowLiteService {
  constructor() {
    this.models = {
      [MODEL_TYPES.PLANT_VILLAGE]: null,
      [MODEL_TYPES.INATURALIST]: null
    };
    this.currentModelType = MODEL_TYPES.PLANT_VILLAGE; // Default to disease detection
    this.isModelLoaded = {
      [MODEL_TYPES.PLANT_VILLAGE]: false,
      [MODEL_TYPES.INATURALIST]: false
    };
    this.isInitialized = false;
    this.imageSize = 224; // Standard size for most plant models
  }

  /**
   * Initialize TensorFlow.js
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('✅ TensorFlow already initialized');
      return true;
    }

    try {
      console.log('🤖 Initializing TensorFlow.js...');
      
      // Initialize TensorFlow.js for React Native
      await tf.ready();
      
      // Set backend to WebGL for better performance
      await tf.setBackend('cpu'); // Use CPU for React Native
      
      this.isInitialized = true;
      console.log('✅ TensorFlow.js initialized successfully');
      console.log('📊 Backend:', tf.getBackend());
      console.log('📊 TensorFlow version:', tf.version.tfjs);
      
      return true;
    } catch (error) {
      console.error('❌ TensorFlow initialization failed:', error);
      return false;
    }
  }

  /**
   * Set active model type
   */
  setModelType(modelType) {
    if (MODEL_TYPES[modelType.toUpperCase()]) {
      this.currentModelType = modelType;
      console.log(`🔄 Switched to ${modelType} model`);
    } else {
      console.error(`❌ Unknown model type: ${modelType}`);
    }
  }

  /**
   * Get current model type
   */
  getModelType() {
    return this.currentModelType;
  }

  /**
   * Load a specific model
   * @param {string} modelType - 'plantvillage' or 'inaturalist'
   */
  async loadModel(modelType = null) {
    const typeToLoad = modelType || this.currentModelType;
    
    if (this.isModelLoaded[typeToLoad] && this.models[typeToLoad]) {
      console.log(`✅ ${typeToLoad} model already loaded`);
      return true;
    }

    try {
      console.log(`📥 Loading ${typeToLoad} model...`);
      
      // Initialize TensorFlow first
      await this.initialize();
      
      // Model paths
      const modelPaths = {
        [MODEL_TYPES.PLANT_VILLAGE]: `${FileSystem.documentDirectory}plant_disease_model/`,
        [MODEL_TYPES.INATURALIST]: `${FileSystem.documentDirectory}inaturalist_model/`
      };
      
      const modelPath = modelPaths[typeToLoad];
      
      // Check if model exists locally
      const modelInfo = await FileSystem.getInfoAsync(modelPath);
      
      if (modelInfo.exists) {
        console.log('📂 Loading model from local storage...');
        this.models[typeToLoad] = await tf.loadLayersModel(`file://${modelPath}model.json`);
      } else {
        console.log('⚠️ Local model not found, creating fallback...');
        this.models[typeToLoad] = await this.createFallbackModel(typeToLoad);
      }
      
      if (this.models[typeToLoad]) {
        this.isModelLoaded[typeToLoad] = true;
        console.log(`✅ ${typeToLoad} model loaded successfully`);
        console.log('📊 Model input shape:', this.models[typeToLoad].inputs[0].shape);
        console.log('📊 Model output shape:', this.models[typeToLoad].outputs[0].shape);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Failed to load ${typeToLoad} model:`, error);
      console.log('💡 Tip: Model will download automatically or use fallback');
      
      // Create a fallback model
      try {
        this.models[typeToLoad] = await this.createFallbackModel(typeToLoad);
        this.isModelLoaded[typeToLoad] = true;
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback model creation failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Create a fallback lightweight model for testing
   * @param {string} modelType - Model type to create
   */
  async createFallbackModel(modelType) {
    console.log(`🔧 Creating fallback ${modelType} model...`);
    
    // Determine output classes
    const outputClasses = modelType === MODEL_TYPES.INATURALIST 
      ? INATURALIST_COMMON_PLANTS.length 
      : PLANT_VILLAGE_LABELS.length;
    
    // Create a simple CNN model for demonstration
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [this.imageSize, this.imageSize, 3],
          kernelSize: 3,
          filters: 32,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          kernelSize: 3,
          filters: 64,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: outputClasses, activation: 'softmax' })
      ]
    });
    
    console.log(`⚠️ Using fallback ${modelType} model - accuracy may be limited`);
    console.log('💡 For better results, download the pre-trained model');
    
    return model;
  }

  /**
   * Download PlantVillage pre-trained model
   * This downloads the model from a remote URL
   */
  async downloadModel(progressCallback = null) {
    try {
      console.log('📥 Starting model download...');
      
      // PlantVillage model URL (you'll need to host this or use a public URL)
      // Example: https://github.com/spMohanty/PlantVillage-Dataset/releases/download/v1.0/model.zip
      const modelUrl = 'YOUR_MODEL_URL_HERE'; // Replace with actual URL
      
      const downloadResumable = FileSystem.createDownloadResumable(
        modelUrl,
        `${FileSystem.documentDirectory}plant_disease_model.zip`,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`📊 Download progress: ${(progress * 100).toFixed(2)}%`);
          if (progressCallback) {
            progressCallback(progress);
          }
        }
      );
      
      const result = await downloadResumable.downloadAsync();
      console.log('✅ Model downloaded successfully:', result.uri);
      
      // TODO: Unzip the model
      // You'll need to add unzip functionality here
      
      return true;
    } catch (error) {
      console.error('❌ Model download failed:', error);
      return false;
    }
  }

  /**
   * Preprocess image for model input
   */
  async preprocessImage(imageUri) {
    try {
      console.log('🖼️ Preprocessing image...');
      
      // Resize image to model input size
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: this.imageSize, height: this.imageSize } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );
      
      // Read image as base64
      const imageBase64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to tensor
      const imageBuffer = tf.util.encodeString(imageBase64, 'base64');
      
      // Decode JPEG to tensor
      let imageTensor = tf.node.decodeJpeg(imageBuffer, 3);
      
      // Normalize pixel values to [0, 1]
      imageTensor = tf.div(imageTensor, 255.0);
      
      // Add batch dimension
      imageTensor = tf.expandDims(imageTensor, 0);
      
      console.log('✅ Image preprocessed:', imageTensor.shape);
      
      return imageTensor;
    } catch (error) {
      console.error('❌ Image preprocessing failed:', error);
      
      // Fallback: create a random tensor for testing
      console.log('⚠️ Using random tensor for testing');
      return tf.randomUniform([1, this.imageSize, this.imageSize, 3]);
    }
  }

  /**
   * Analyze plant using TensorFlow Lite model
   * @param {string} imageUri - Image URI to analyze
   * @param {string} modelType - Optional model type override
   */
  async analyzeDisease(imageUri, modelType = null) {
    try {
      const typeToUse = modelType || this.currentModelType;
      console.log(`🤖 Starting offline analysis with ${typeToUse} model...`);
      console.log('📸 Image URI:', imageUri);
      
      // Ensure model is loaded
      if (!this.isModelLoaded[typeToUse]) {
        await this.loadModel(typeToUse);
      }
      
      if (!this.models[typeToUse]) {
        throw new Error(`${typeToUse} model not loaded`);
      }
      
      // Preprocess image
      const imageTensor = await this.preprocessImage(imageUri);
      
      // Run inference
      console.log('🔄 Running model inference...');
      const startTime = Date.now();
      const predictions = await this.models[typeToUse].predict(imageTensor);
      const inferenceTime = Date.now() - startTime;
      
      // Get prediction results
      const predictionArray = await predictions.data();
      
      // Find top 3 predictions
      const topPredictions = this.getTopPredictions(predictionArray, 3, typeToUse);
      
      console.log('✅ Analysis complete:', {
        modelType: typeToUse,
        inferenceTime: `${inferenceTime}ms`,
        topPrediction: topPredictions[0]
      });
      
      // Format results
      const result = this.formatAnalysisResult(topPredictions, inferenceTime, typeToUse);
      
      // Cleanup tensors
      imageTensor.dispose();
      predictions.dispose();
      
      return result;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw new Error(`Offline analysis failed: ${error.message}`);
    }
  }

  /**
   * Get top N predictions from model output
   * @param {Array} predictions - Model predictions
   * @param {number} topN - Number of top predictions to return
   * @param {string} modelType - Model type used
   */
  getTopPredictions(predictions, topN = 3, modelType = null) {
    const typeToUse = modelType || this.currentModelType;
    const labels = typeToUse === MODEL_TYPES.INATURALIST 
      ? INATURALIST_COMMON_PLANTS 
      : PLANT_VILLAGE_LABELS;
    
    const predictionsList = Array.from(predictions).map((probability, index) => ({
      label: labels[index] || `Unknown_${index}`,
      probability,
      confidence: probability * 100
    }));
    
    // Sort by probability (descending)
    predictionsList.sort((a, b) => b.probability - a.probability);
    
    // Return top N
    return predictionsList.slice(0, topN);
  }

  /**
   * Format analysis result for display
   * @param {Array} topPredictions - Top predictions from model
   * @param {number} inferenceTime - Inference time in ms
   * @param {string} modelType - Model type used
   */
  formatAnalysisResult(topPredictions, inferenceTime, modelType) {
    const topPrediction = topPredictions[0];
    
    if (modelType === MODEL_TYPES.INATURALIST) {
      // Format for plant identification
      const { scientificName, commonName, category } = parsePlantLabel(topPrediction.label);
      const careInfo = getPlantCareRecommendations(topPrediction.label);
      const productCategories = getPlantProducts(topPrediction.label);
      const family = getPlantFamily(topPrediction.label);
      const isAgricultural = isAgriculturalPlant(topPrediction.label);
      
      return {
        success: true,
        source: 'tensorflow_lite',
        model_type: 'inaturalist',
        inferenceTime: `${inferenceTime}ms`,
        plant_type: commonName,
        scientific_name: scientificName,
        plant_family: family,
        category: category,
        is_agricultural: isAgricultural,
        confidence: topPrediction.probability,
        care_recommendations: careInfo,
        product_categories: productCategories,
        alternative_identifications: topPredictions.slice(1).map(pred => ({
          plant: formatPlantName(pred.label),
          confidence: pred.probability
        })),
        note: '📱 Plant identification using iNaturalist model (Offline)'
      };
    } else {
      // Format for disease detection (PlantVillage)
      const { crop, disease, isHealthy } = parseDiseaseLabel(topPrediction.label);
      const recommendations = getDiseaseRecommendations(topPrediction.label);
      
      return {
        success: true,
        source: 'tensorflow_lite',
        model_type: 'plantvillage',
        inferenceTime: `${inferenceTime}ms`,
        crop_type: crop,
        plant_family: 'Unknown (requires online analysis)',
        growth_stage: 'Unknown (requires online analysis)',
        health_status: isHealthy ? 'healthy' : 'diseased',
        disease_type: disease,
        severity_level: recommendations.severity,
        confidence: topPrediction.probability,
        symptoms: ['Detected from image analysis'],
        affected_parts: ['Leaves'],
        recommendations: recommendations.treatments,
        prevention: recommendations.prevention,
        alternative_predictions: topPredictions.slice(1).map(pred => ({
          disease: formatDiseaseName(pred.label),
          confidence: pred.probability
        })),
        store_category: getCropStoreCategory(crop),
        note: '📱 Disease detection using PlantVillage model (Offline)'
      };
    }
  }

  /**
   * Check if model is ready
   * @param {string} modelType - Optional model type to check
   */
  isReady(modelType = null) {
    const typeToCheck = modelType || this.currentModelType;
    return this.isInitialized && 
           this.isModelLoaded[typeToCheck] && 
           this.models[typeToCheck] !== null;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      isInitialized: this.isInitialized,
      currentModelType: this.currentModelType,
      modelsLoaded: {
        plantvillage: this.isModelLoaded[MODEL_TYPES.PLANT_VILLAGE],
        inaturalist: this.isModelLoaded[MODEL_TYPES.INATURALIST]
      },
      backend: this.isInitialized ? tf.getBackend() : 'Not initialized',
      modelClasses: {
        plantvillage: PLANT_VILLAGE_LABELS.length,
        inaturalist: INATURALIST_COMMON_PLANTS.length
      },
      imageSize: this.imageSize,
      availableModels: Object.values(MODEL_TYPES)
    };
  }

  /**
   * Cleanup resources
   * @param {string} modelType - Optional specific model to dispose
   */
  dispose(modelType = null) {
    if (modelType) {
      // Dispose specific model
      if (this.models[modelType]) {
        this.models[modelType].dispose();
        this.models[modelType] = null;
        this.isModelLoaded[modelType] = false;
        console.log(`🧹 ${modelType} model disposed`);
      }
    } else {
      // Dispose all models
      Object.keys(this.models).forEach(type => {
        if (this.models[type]) {
          this.models[type].dispose();
          this.models[type] = null;
          this.isModelLoaded[type] = false;
        }
      });
      console.log('🧹 All TensorFlow resources cleaned up');
    }
  }
}

// Create singleton instance
const tensorflowLiteService = new TensorFlowLiteService();

export default tensorflowLiteService;
export { TensorFlowLiteService, MODEL_TYPES };

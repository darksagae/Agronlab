import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import hybridAIService from '../services/hybridAIService';
import ProductRecommendationCards from '../components/ProductRecommendationCards';
import authService from '../services/authService';

const { width, height } = Dimensions.get('window');

const DiseaseDetectionScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('checking');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Initialize Hybrid AI Service and check auth on component mount
  useEffect(() => {
    initializeAI();
    checkAuthentication();
  }, []);

  // Check if user is authenticated
  const checkAuthentication = async () => {
    try {
      const authResult = await authService.getCurrentUser();
      if (authResult.success && authResult.user) {
        setIsAuthenticated(true);
        console.log('👤 User authenticated in Disease Detection:', authResult.user.email);
      } else {
        setIsAuthenticated(false);
        console.log('⚠️ User not authenticated in Disease Detection');
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const initializeAI = async () => {
    try {
      console.log('🚀 Initializing Hybrid AI Service...');
      await hybridAIService.initialize();
      const status = hybridAIService.getStatus();
      setAiStatus(status);
      setNetworkStatus(status.isOnline ? 'online' : 'offline');
      console.log('✅ Hybrid AI initialized:', status);
    } catch (error) {
      console.error('❌ AI initialization failed:', error);
      Alert.alert('AI Initialization', 'AI service started with limited features');
    }
  };

  // Request permissions and pick image from gallery (Alternative Method)
  const pickImageFromGallery = async () => {
    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select images');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        
        // Validate image data
        if (!image.uri) {
          throw new Error('Image URI is missing');
        }
        
        setSelectedImage(image);
        setAnalysisResult(null);
        setError(null);
        Alert.alert('Success', 'Image selected successfully!');
      } else {
        Alert.alert('Info', 'No image was selected');
      }
    } catch (error) {
      setError(`Gallery error: ${error.message}`);
      Alert.alert('Error', `Failed to pick image: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Request permissions and take photo with camera (Alternative Method)
  const takePhotoWithCamera = async () => {
    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        
        // Validate image data
        if (!image.uri) {
          throw new Error('Image URI is missing');
        }
        
        setSelectedImage(image);
        setAnalysisResult(null);
        setError(null);
        Alert.alert('Success', 'Photo taken successfully!');
      }
    } catch (error) {
      setError(`Camera error: ${error.message}`);
      Alert.alert('Error', `Failed to take photo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze image with Hybrid AI (Gemini online / TensorFlow Lite offline)
  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    // Check authentication before analyzing
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 Starting hybrid AI analysis...');
      
      // Use hybrid AI service (automatically switches between Gemini and TensorFlow)
      const result = await hybridAIService.analyzeDisease(selectedImage.uri);

      console.log('✅ Analysis complete:', result);

      // Update network status
      const status = hybridAIService.getStatus();
      setNetworkStatus(status.isOnline ? 'online' : 'offline');

      // Format result for display
      // Check if result already has 'analysis' nested (from Gemini) or if data is at top level
      const analysisData = result.analysis || result;
      
      const formattedResult = {
          status: 'success',
        message: getAnalysisMessage(result),
        analysis: analysisData, // Use the extracted analysis data
        timestamp: result.timestamp || new Date().toISOString(),
        source: result.source || 'Gemini AI',
        analysisMethod: result.analysisMethod || 'gemini'
      };

      setAnalysisResult(formattedResult);
      
      console.log('📊 Formatted result set to state:', JSON.stringify(formattedResult, null, 2));
      console.log('🎯 Analysis result disease:', formattedResult.analysis?.disease_type);
      console.log('🎯 Analysis result crop:', formattedResult.analysis?.crop_type);
      
      Alert.alert(
        'Analysis Complete',
        `Disease detected using ${result.source === 'Gemini AI' ? 'Gemini AI (Online)' : 'TensorFlow Lite (Offline)'}\n\nCrop: ${result.crop_type || 'Unknown'}\nDisease: ${result.disease_type || 'Unknown'}\nConfidence: ${(result.confidence * 100).toFixed(1)}%`,
        [{ text: 'View Results' }]
      );
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(error.message);
      Alert.alert(
        'Analysis Failed',
        `Failed to analyze image: ${error.message}\n\nPlease ensure:\n• Image is clear and well-lit\n• Plant is visible in the image\n• You have network connection (for Gemini) or model downloaded (for offline mode)`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get analysis message based on source
  const getAnalysisMessage = (result) => {
    if (result.source === 'gemini') {
      return '✨ Analysis completed using Gemini AI (Online mode)';
    } else if (result.source === 'tensorflow_lite') {
      return '📱 Analysis completed using TensorFlow Lite (Offline mode)';
    } else if (result.analysisMethod === 'offline_fallback') {
      return '📱 Online service unavailable - using TensorFlow Lite (Offline fallback)';
    } else if (result.source === 'cache') {
      return '📦 Using cached analysis result';
    }
    return 'Analysis completed';
  };

  // Reset all states
  const resetAll = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
    setIsLoading(false);
  };

  // Render image selection area
  const renderImageSelection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}><Text>📸 Select Plant Image</Text></Title>
        <Paragraph style={styles.cardSubtitle}>
          <Text>Take a photo or choose from gallery to detect plant diseases</Text>
        </Paragraph>
        
        {/* Image Display Area */}
        <View style={styles.imageContainer}>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.imagePreview}
                onError={(error) => {
                  setError('Failed to load image. Please try again.');
                }}
              />
              <TouchableOpacity style={styles.removeButton} onPress={resetAll}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.imageInfo}>
                <Text style={styles.imageInfoText}>
                  {selectedImage.width}x{selectedImage.height} • {Math.round((selectedImage.fileSize || 0) / 1024)}KB
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imagePlaceholder}
              onPress={pickImageFromGallery}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#4CAF50" />
              ) : (
                <>
                  <MaterialIcons name="add-a-photo" size={64} color="#666" />
                  <Text style={styles.placeholderText}>Tap to select image</Text>
                  <Text style={styles.placeholderSubtext}>or use buttons below</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.galleryButton]} 
            onPress={pickImageFromGallery}
            disabled={isLoading}
          >
            <MaterialIcons name="photo-library" size={24} color="#fff" />
            <Text style={styles.buttonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cameraButton]} 
            onPress={takePhotoWithCamera}
            disabled={isLoading}
          >
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>




        {/* Analyze Button */}
        {selectedImage && (
          <Button
            mode="contained"
            onPress={analyzeImage}
            disabled={isAnalyzing}
            style={styles.analyzeButton}
            contentStyle={styles.analyzeButtonContent}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff' }}>Analyzing...</Text>
              </>
            ) : (
              <Text style={{ color: '#fff' }}>🔍 Analyze Disease</Text>
            )}
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  // Render analysis results
  const renderAnalysisResults = () => {
    console.log('🎨 renderAnalysisResults called, analysisResult:', !!analysisResult);
    if (!analysisResult) {
      console.log('⚠️ analysisResult is null, not rendering');
      return null;
    }

    console.log('✅ Rendering analysis results!');
    console.log('📊 Analysis data:', analysisResult.analysis);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Analysis Results</Title>
          
          {/* Crop Identification */}
          <View style={styles.resultSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="eco" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Crop Identification</Text>
            </View>
            <View style={styles.cropInfo}>
              <Text style={styles.cropType}>
                {analysisResult.analysis?.crop_type || 'Unknown Crop'}
              </Text>
              <Text style={styles.plantFamily}>
                Family: {analysisResult.analysis?.plant_family || 'Unknown'}
              </Text>
              <Text style={styles.growthStage}>
                Stage: {analysisResult.analysis?.growth_stage || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Health Status */}
          <View style={styles.resultSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons 
                name="favorite" 
                size={24} 
                color={analysisResult.analysis?.health_status === 'healthy' ? '#4CAF50' : '#FF5722'} 
              />
              <Text style={styles.sectionTitle}>Health Status</Text>
            </View>
            <Chip 
              style={[
                styles.healthChip,
                { backgroundColor: analysisResult.analysis?.health_status === 'healthy' ? '#E8F5E8' : '#FFEBEE' }
              ]}
              textStyle={{
                color: analysisResult.analysis?.health_status === 'healthy' ? '#2E7D32' : '#C62828'
              }}
            >
              <Text>{analysisResult.analysis?.health_status === 'healthy' ? 'Healthy Plant' : 'Diseased Plant'}</Text>
            </Chip>
          </View>

          {/* Disease Information */}
          {analysisResult.analysis?.disease_type && analysisResult.analysis.disease_type !== 'none' && (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Disease Detected</Text>
              </View>
              <Text style={styles.diseaseName}>
                {analysisResult.analysis.disease_type}
              </Text>
              {analysisResult.analysis.severity_level && (
                <Text style={styles.severity}>
                  Severity: {analysisResult.analysis.severity_level}
                </Text>
              )}
            </View>
          )}

          {/* Recommendations */}
          {analysisResult.analysis?.recommendations && analysisResult.analysis.recommendations.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              {analysisResult.analysis.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}

          {/* Confidence Score */}
          {analysisResult.analysis?.confidence && (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Confidence Score</Text>
              </View>
              <Text style={styles.confidence}>
                {Math.round(analysisResult.analysis.confidence * 100)}%
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render error message
  const renderError = () => {
    if (!error) return null;

    return (
      <Card style={[styles.card, styles.errorCard]}>
        <Card.Content>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={24} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <Button mode="outlined" onPress={() => setError(null)} style={styles.retryButton}>
            <Text style={{ color: '#F44336' }}>Dismiss</Text>
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background handled by App.js BackgroundImage wrapper */}
      
      {/* Content */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Back Button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#2E7D32" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Disease Detection</Text>
              <Text style={styles.headerSubtitle}>Advanced plant health analysis and crop monitoring</Text>
            </View>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* Image Selection */}
            {renderImageSelection()}

            {/* Error Display */}
            {renderError()}

            {/* Analysis Results */}
            {renderAnalysisResults()}

            {/* Product Recommendations */}
            {analysisResult && (
              <ProductRecommendationCards
                diseaseType={analysisResult.analysis?.disease_type}
                symptoms={analysisResult.analysis?.symptoms}
                onProductPress={(product) => {
                  // Navigate to product detail or handle product selection
                  console.log('Product selected:', product);
                }}
              />
            )}

          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Authentication Prompt Modal */}
      <Modal
        visible={showAuthPrompt}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAuthPrompt(false)}
      >
        <View style={styles.authModalOverlay}>
          <View style={styles.authCard}>
            <View style={styles.authLogoContainer}>
              <Image 
                source={require('../assets/logo.png')}
                style={styles.authLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.authTitle}>Sign In to Analyze</Text>
            <Text style={styles.authMessage}>
              Create an account or sign in to use AI-powered disease detection and get personalized recommendations for your crops.
            </Text>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>AI disease detection</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Treatment recommendations</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Save analysis history</Text>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.authSignupButton}
              onPress={async () => {
                setShowAuthPrompt(false);
                // Save the current image before navigating
                const currentImage = selectedImage;
                if (navigation && navigation.navigate) {
                  navigation.navigate('signup');
                }
                // After user returns, check if they're authenticated and auto-analyze
                setTimeout(async () => {
                  await checkAuthentication();
                  if (currentImage && isAuthenticated) {
                    console.log('🔄 User authenticated, auto-analyzing saved image...');
                    // Image is still in state, will auto-analyze on next attempt
                  }
                }, 1000);
              }}
            >
              <Text style={styles.authSignupButtonText}>Create Free Account</Text>
            </TouchableOpacity>

            {/* Log In Button */}
            <TouchableOpacity
              style={styles.authLoginButton}
              onPress={async () => {
                setShowAuthPrompt(false);
                // Save the current image before navigating
                const currentImage = selectedImage;
                if (navigation && navigation.navigate) {
                  navigation.navigate('login');
                }
                // After user returns, check if they're authenticated and auto-analyze
                setTimeout(async () => {
                  await checkAuthentication();
                  if (currentImage && isAuthenticated) {
                    console.log('🔄 User authenticated, auto-analyzing saved image...');
                    // Image is still in state, will auto-analyze on next attempt
                  }
                }, 1000);
              }}
            >
              <Text style={styles.authLoginButtonText}>Already have an account? Log In</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.authCloseButton}
              onPress={() => setShowAuthPrompt(false)}
            >
              <Text style={styles.authCloseButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent overlay for better text readability
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)', // Semi-transparent dark background
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 51, 51, 0.5)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333333',
  },
  headerContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cccccc',
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    elevation: 2,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageInfoText: {
    color: '#fff',
    fontSize: 12,
  },
  imageDebugInfo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: width - 100,
  },
  imagePlaceholder: {
    width: width - 64,
    height: 200,
    backgroundColor: '#333333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    marginTop: 4,
    color: '#cccccc',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#FF9800',
    marginTop: 8,
  },
  analyzeButtonContent: {
    paddingVertical: 8,
  },
  resultSection: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#ffffff',
  },
  healthChip: {
    alignSelf: 'flex-start',
  },
  cropInfo: {
    marginTop: 8,
  },
  cropType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  plantFamily: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 2,
  },
  growthStage: {
    fontSize: 14,
    color: '#cccccc',
    fontStyle: 'italic',
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 4,
  },
  severity: {
    fontSize: 14,
    color: '#cccccc',
  },
  recommendation: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 20,
  },
  confidence: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  errorCard: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    borderColor: '#F44336',
  },
  instructionText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  
  // Authentication Modal Styles
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  authMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 25,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 10,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  authLogoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  authLogoImage: {
    width: 80,
    height: 80,
  },
  authSignupButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authSignupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authLoginButton: {
    paddingVertical: 12,
    marginBottom: 10,
  },
  authLoginButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  authCloseButton: {
    paddingVertical: 10,
    marginTop: 10,
  },
  authCloseButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
export default DiseaseDetectionScreen;

import './config/amplifyConfig';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions, FlatList, Modal, TextInput, Platform, ActivityIndicator, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ChatBot from './components/ChatBot';
import ChatBotButton from './components/ChatBotButton';
import LanguageSwitcher from './components/LanguageSwitcher';
// ChatBotTraining removed - AI functionality disabled
// AI components removed
import BackgroundImage from './components/BackgroundImage';
import StoreScreen from './screens/StoreScreen';
import StocksStyleScreen from './screens/StocksStyleScreen';
import ProductTradingScreen from './screens/ProductTradingScreen';
// SmartFarmingDashboard removed - dashboard functionality disabled
import DiseaseDetectionScreen from './screens/DiseaseDetectionScreen';
import ProductRecommendationCards from './components/ProductRecommendationCards';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { QueryProvider } from './providers/QueryProvider';
import { cropProducts } from './data/cropProducts';
import './i18n'; // Initialize i18n
import authService from './services/authService';
import { ensureMerchantProfile } from './services/chatService';

// Authentication imports
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import AuthGate from './components/AuthGate';
import ChatScreen from './screens/ChatScreen';
import BuyerRequestScreen from './screens/BuyerRequestScreen';
import SellerRequestScreen from './screens/SellerRequestScreen';
import ProductSelectionScreen from './screens/ProductSelectionScreen';
import PriceQuantityInputScreen from './screens/PriceQuantityInputScreen';
import P2PMarketPanel from './screens/P2PMarketPanel';
import P2PProductsScreen from './screens/P2PProductsScreen';
import InquiryFormScreen from './screens/InquiryFormScreen';
import CreateBuyRequestScreen from './screens/CreateBuyRequestScreen';
import BrowseBuyRequestsScreen from './screens/BrowseBuyRequestsScreen';
import BuyRequestDetailsScreen from './screens/BuyRequestDetailsScreen';
import ConversationScreen from './screens/ConversationScreen';
import MessagesInboxScreen from './screens/MessagesInboxScreen';
import PaymentScreen from './screens/PaymentScreen';
import SubscriptionStatusCard from './components/SubscriptionStatusCard';
import StoreDirectoryLanding from './screens/StoreDirectoryLanding';
import AgronStoreLanding from './screens/AgronStoreLanding';
import AgronCategoryScreen from './screens/AgronCategoryScreen';
import AgronProductScreen from './screens/AgronProductScreen';
import RegisteredStoreScreen from './screens/RegisteredStoreScreen';


const { width, height } = Dimensions.get('window');

// Update API URL to use deployed backend
const API_URL = 'https://loyal-wholeness-production.up.railway.app'; // Deployed Railway backend
// const API_URL = 'http://192.168.1.10:5000'; // Use your computer's IP address for local testing
// const API_URL = 'http://localhost:5000'; // For web browser testing

export default function App() {
  // Load Material Icons font
  const [fontsLoaded] = useFonts({
    // Material Icons are included in @expo/vector-icons by default
    // This ensures they're loaded before rendering
  });
  
  const { t, i18n } = useTranslation();
  const [currentTab, setCurrentTab] = useState('home');
  const [languageKey, setLanguageKey] = useState(0); // Force re-render key
  const [currentScreen, setCurrentScreen] = useState('disease-detection');
  const [systemStatus, setSystemStatus] = useState('initializing');
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  // Authentication state
  const [showAuthScreen, setShowAuthScreen] = useState(null); // null, 'login', 'signup', 'verification'
  const [authScreenParams, setAuthScreenParams] = useState({});
  
  // Chat state
  const [showChatScreen, setShowChatScreen] = useState(false);
  const [chatOtherUser, setChatOtherUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Store user data
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editableUserData, setEditableUserData] = useState({
    username: '',
    phone: '',
    profilePhoto: null
  });
  
  // All other state declarations
  const [navigationStack, setNavigationStack] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [cropPlans, setCropPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('calendar'); // calendar, rotation, budget
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    crop: '',
    area: '',
    startDate: '',
    endDate: '',
    budget: '',
    notes: ''
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(new Date());
  const [planEndDate, setPlanEndDate] = useState(new Date());
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [showAddBudgetItem, setShowAddBudgetItem] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState({ name: '', amount: '', category: '', date: '', productId: null });
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [themeColor, setThemeColor] = useState('#4CAF50'); // Customizable theme
  const [currentAccountScreen, setCurrentAccountScreen] = useState('main'); // main, about, help
  const [screenParams, setScreenParams] = useState(null); // For passing params between screens
  const [showChatbot, setShowChatbot] = useState(false); // For bot image chatbot

  // Store tab sub-navigation
  const [agronSubScreen, setAgronSubScreen] = useState(null); // null | 'agron-home' | 'category' | 'product' | 'merchant-store'
  const [agronCategory, setAgronCategory] = useState(null);
  const [agronProduct, setAgronProduct] = useState(null);
  const [selectedMerchantStore, setSelectedMerchantStore] = useState(null);

  // P2P (stocks) tab sub-navigation
  const [p2pSubScreen, setP2pSubScreen] = useState(null); // null | 'inquiry'
  const [p2pListing, setP2pListing] = useState(null);
  
  // Initialize auth on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const success = await authService.initialize();
        if (success) {
          const authResult = await authService.getCurrentUser();
          if (authResult.success && authResult.user) {
            setIsAuthenticated(true);
            setIsEmailVerified(authResult.user.emailVerified);
            setCurrentUser(authResult.user);
            setEditableUserData({
              username: authResult.user.username || authResult.user.fullName || 'AGRON User',
              phone: authResult.user.phone || '',
              profilePhoto: authResult.user.profilePhoto || null
            });
          }
          const healthCheck = await authService.healthCheck();
          setSystemStatus(healthCheck.connected ? 'connected' : 'partial');
        } else {
          setSystemStatus('error');
        }
      } catch (error) {
        setSystemStatus('error');
        console.error('Auth initialization error:', error);
      }
    };

    initializeAuth();
  }, []);

  // Register E2E encryption public key in MerchantProfile when user is available
  useEffect(() => {
    if (currentUser?.uid) {
      ensureMerchantProfile(currentUser).catch(() => {});
    }
  }, [currentUser?.uid]);

  // Authentication helper functions
  const handleAuthSuccess = async () => {
    console.log('🔐 handleAuthSuccess called - loading user data');
    setShowAuthScreen(null);
    
    // Re-check authentication status and load user data
    const authResult = await authService.getCurrentUser();
    console.log('🔐 Auth result after success:', authResult);
    
    if (authResult.success && authResult.user) {
      console.log('✅ Setting App.js authentication states...');
      setIsAuthenticated(true);
      setIsEmailVerified(authResult.isVerified || authResult.user.emailVerified);
      setCurrentUser(authResult.user);
      setEditableUserData({
        username: authResult.user.username || authResult.user.fullName || 'AGRON User',
        phone: authResult.user.phone || '',
        profilePhoto: authResult.user.profilePhoto || null
      });
      console.log('✅ User authenticated and data loaded in App.js:', {
        uid: authResult.user.uid,
        email: authResult.user.email,
        fullName: authResult.user.fullName,
        phone: authResult.user.phone,
        username: authResult.user.username
      });
    } else {
      console.error('❌ Failed to load user data after authentication');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all cached data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🔐 Logging out and clearing data...');
            const result = await authService.signOut();
            
            if (result.success) {
              setIsAuthenticated(false);
              setIsEmailVerified(false);
              setCurrentUser(null);
              setEditableUserData({ username: '', phone: '', profilePhoto: null });
              setShowAuthScreen(null);
              
              Alert.alert(
                'Logged Out',
                'You have been logged out successfully. All cached data has been cleared.',
                [{ text: 'OK' }]
              );
              console.log('✅ Logout complete - app reset to fresh state');
            } else {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const navigateToAuth = (screen) => {
    setShowAuthScreen(screen);
  };

  // Profile editing functions
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // Lower quality for smaller base64 size
      base64: true, // Enable base64 encoding for persistent storage
    });

    if (!result.canceled) {
      console.log('📸 Photo selected, converting to base64 for cloud storage...');
      const base64 = result.assets[0].base64;
      
      if (base64) {
        // Convert to base64 data URI (stored in local profile)
        const base64Image = `data:image/jpeg;base64,${base64}`;
        console.log('✅ Photo converted to base64, size:', Math.round(base64.length / 1024), 'KB');
        
        setEditableUserData(prev => ({
          ...prev,
          profilePhoto: base64Image
        }));
        
        // Also update currentUser immediately so photo shows right away
        setCurrentUser(prev => ({
          ...prev,
          profilePhoto: base64Image
        }));
        
        console.log('✅ Photo updated in state - should be visible now!');
      } else {
        // Fallback to URI if base64 fails
        console.log('⚠️ Base64 not available, using URI (may not persist)');
        const photoUri = result.assets[0].uri;
        
        setEditableUserData(prev => ({
          ...prev,
          profilePhoto: photoUri
        }));
        
        // Also update currentUser immediately
        setCurrentUser(prev => ({
          ...prev,
          profilePhoto: photoUri
        }));
      }
    }
  };

  const handleSaveProfile = async () => {
    console.log('💾 Saving profile...');
    console.log('Current User:', currentUser);
    console.log('Editable Data:', editableUserData);
    
    if (!currentUser) {
      console.error('❌ No current user found!');
      Alert.alert('Error', 'User not loaded. Please try again.');
      return;
    }

    // Check if phone number changed
    const phoneChanged = editableUserData.phone !== currentUser.phone;
    console.log('Phone changed?', phoneChanged);
    
    if (phoneChanged) {
      // Update phone number directly via authService
      setLoading(true);
      try {
        const result = await authService.updateUserData(currentUser.uid, { phone: editableUserData.phone });
        setLoading(false);
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to update phone number');
          return;
        }
      } catch (e) {
        setLoading(false);
        Alert.alert('Error', 'Failed to update phone number');
        return;
      }
    }

    // Username and photo can be changed without verification
    console.log('✅ Updating username and photo...');
    setLoading(true);
    try {
      // Prepare photo data (base64 is already ready to save)
      let photoURL = editableUserData.profilePhoto;
      console.log('📸 Processing profile photo...');
      console.log('   Current photo:', currentUser.profilePhoto ? 'EXISTS' : 'NONE');
      console.log('   New photo:', photoURL ? 'EXISTS' : 'NONE');
      
      if (photoURL) {
        const photoType = photoURL.startsWith('data:') ? 'BASE64' : 
                         photoURL.startsWith('http') ? 'URL' : 'FILE';
        console.log('   Photo type:', photoType);
        console.log('   Photo size:', Math.round(photoURL.length / 1024), 'KB');
      }

      // Update username and photo (no verification needed)
      // Photo is already in correct format (base64 or URL)
      console.log('💾 Updating user profile (Cognito + local storage)...');
      const updateData = {
        username: editableUserData.username,
        profilePhoto: photoURL  // Save base64 or URL directly
      };
      console.log('📦 Update data prepared:', {
        username: updateData.username,
        hasPhoto: !!updateData.profilePhoto,
        photoSize: updateData.profilePhoto ? Math.round(updateData.profilePhoto.length / 1024) + ' KB' : 'N/A'
      });

      const updateResult = await authService.updateUserData(currentUser.uid, updateData);
      console.log('📊 Update result:', updateResult);

      if (updateResult.success) {
        console.log('✅ Profile update API call succeeded!');
        console.log('📸 Verifying photo was actually saved...');
        
        // Reload user data from local profile
        console.log('🔄 Refreshing user data from local profile...');
        const freshUserData = await authService.getCurrentUser();
        
        if (freshUserData.success && freshUserData.user) {
          console.log('✅ Fresh data loaded from local profile');
          console.log('📸 VERIFICATION - Photo in profile:');
          console.log('   - Has Photo:', freshUserData.user.profilePhoto ? 'YES ✅' : 'NO ❌');
          
          if (freshUserData.user.profilePhoto) {
            console.log('   - Photo Type:', freshUserData.user.profilePhoto.startsWith('data:') ? 'BASE64' : 'URL');
            console.log('   - Photo Size:', Math.round(freshUserData.user.profilePhoto.length / 1024), 'KB');
            console.log('   - Photo Preview:', freshUserData.user.profilePhoto.substring(0, 100) + '...');
          } else {
            console.error('❌ PHOTO NOT SAVED TO LOCAL PROFILE!');
            console.error('   Photo was NOT saved - check updateUserData function');
          }
          
          // Update App.js state
          setCurrentUser(freshUserData.user);
          setEditableUserData({
            username: freshUserData.user.username || freshUserData.user.fullName || 'AGRON User',
            phone: freshUserData.user.phone || '',
            profilePhoto: freshUserData.user.profilePhoto || null
          });
          
          console.log('✅ App.js state updated with new photo');
          
          // Force a re-render by changing a key or state
          setLanguageKey(prev => prev + 1);
          console.log('🔄 Forced app re-render to update all components');
        }
        
        setIsEditingProfile(false);
        Alert.alert(
          'Success', 
          'Profile updated successfully!\n\nYour photo is saved on this device and will appear in the app.\n\nNavigate to another tab and back to see changes in all components.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ Update failed:', updateResult.error);
        Alert.alert('Error', updateResult.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleCancelEdit = () => {
    if (currentUser) {
      setEditableUserData({
        username: currentUser.username || currentUser.fullName || 'AGRON User',
        phone: currentUser.phone || '',
        profilePhoto: currentUser.profilePhoto || null
      });
    }
    setShowPhoneVerification(false);
    setVerificationCode('');
    setIsEditingProfile(false);
  };
  
  // Force re-render when language changes
  useEffect(() => {
    console.log('Current language:', i18n.language);
    
    // Force re-render every time the component mounts or language changes
    setLanguageKey(prev => prev + 1);
  }, [i18n.language]);
  
  // Update current language when i18n language changes
  useEffect(() => {
    const updateLanguage = () => {
      console.log('Language changed to:', i18n.language);
      setCurrentLanguage(i18n.language);
      setLanguageKey(prev => prev + 1);
    };
    
    // Check for language changes periodically
    const interval = setInterval(() => {
      if (i18n.language !== currentLanguage) {
        updateLanguage();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentLanguage]);

  // Camera permissions removed - camera functionality disabled

  // Optional LAN store-backend discovery (S3 catalog does not need this). Off by default to avoid timeouts/noise.
  useEffect(() => {
    const testBackendConnection = async () => {
      if (process.env.EXPO_PUBLIC_ENABLE_LAN_STORE_PROBE !== '1') {
        return;
      }
      try {
        console.log('🔍 Testing backend connection with dynamic endpoint discovery...');

        const { findWorkingApiEndpoint, getCurrentApiConfig } = await import('./config/apiConfig');

        const workingIp = await findWorkingApiEndpoint();
        
        if (workingIp) {
          const config = getCurrentApiConfig();
          console.log('✅ Backend connection successful:', {
            workingIp,
            storeUrl: config.storeUrl,
            aiUrl: config.aiUrl
          });
        } else {
          console.warn('⚠️ No working backend endpoints found, using offline mode');
        }
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        console.log('📱 App will continue in offline mode with cached data');
        // Don't show alert for network errors - just log and continue
      }
    };

    testBackendConnection();
  }, []);

  // Start background video when Care tab is active
  // Background video removed - no longer needed


  // Blog and community posts data removed

  // Save analysis result
  const saveAnalysis = (analysisResult) => {
    const newAnalysis = {
      id: Date.now(),
      ...analysisResult,
      timestamp: new Date().toISOString(),
      image: image
    };
    setSavedAnalyses(prev => [newAnalysis, ...prev]);
  };

  // Delete analysis
  const deleteAnalysis = (analysisId) => {
    setSavedAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
  };

  // View analysis details
  const viewAnalysis = (analysis) => {
    setResult(analysis);
    setShowAIAnalysis(true);
  };

  // Save crop plan
  const saveCropPlan = (plan) => {
    setCropPlans(prev => [plan, ...prev]);
  };

  // Calculate budget based on crop type and area
  const calculateBudget = (crop, area) => {
    const baseCosts = {
      'Maize': { seed: 150, fertilizer: 300, labor: 200, equipment: 150 },
      'Coffee': { seed: 300, fertilizer: 400, labor: 400, equipment: 200 },
      'Beans': { seed: 80, fertilizer: 150, labor: 120, equipment: 100 },
      'Wheat': { seed: 120, fertilizer: 250, labor: 180, equipment: 120 }
    };
    
    const costs = baseCosts[crop] || baseCosts['Maize'];
    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    // Convert to UGX
    return convertToUGX(totalCost * parseFloat(area));
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle start date change
  const onPlanStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPlanStartDate(selectedDate);
      setNewPlan({...newPlan, startDate: formatDate(selectedDate)});
    }
  };

  // Handle end date change
  const onPlanEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPlanEndDate(selectedDate);
      setNewPlan({...newPlan, endDate: formatDate(selectedDate)});
    }
  };

  // Add notification
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type, // info, success, warning, error
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev]);
  };

  // Add new crop plan
  const addCropPlan = () => {
    if (!newPlan.crop || !newPlan.area || !newPlan.startDate || !newPlan.endDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const budget = calculateBudget(newPlan.crop, newPlan.area);
    
    if (editingPlanId) {
      // Update existing plan
      const updatedPlans = cropPlans.map(plan =>
        plan.id === editingPlanId
          ? { ...newPlan, id: editingPlanId, budget, createdAt: plan.createdAt }
          : plan
      );
      setCropPlans(updatedPlans);
      setEditingPlanId(null);
      addNotification(`Updated plan for ${newPlan.crop}`, 'success');
      Alert.alert('Success', 'Crop plan updated successfully!');
    } else {
      // Add new plan
    const plan = {
      ...newPlan,
      id: Date.now(),
      budget,
      createdAt: new Date().toISOString()
    };
    saveCropPlan(plan);
      addNotification(`Added new plan for ${newPlan.crop} - ${formatUGX(budget)}`, 'success');
      Alert.alert('Success', 'Crop plan added successfully!');
    }

    setNewPlan({ crop: '', area: '', startDate: '', endDate: '', budget: '', notes: '' });
    setShowAddPlan(false);
  };

  // Delete crop plan
  const deleteCropPlan = (planId) => {
    const plan = cropPlans.find(p => p.id === planId);
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete the plan for ${plan?.crop}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCropPlans(cropPlans.filter(p => p.id !== planId));
            addNotification(`Deleted plan for ${plan?.crop}`, 'warning');
            Alert.alert('Success', 'Crop plan deleted successfully!');
          }
        }
      ]
    );
  };

  // Edit crop plan
  const editCropPlan = (plan) => {
    setNewPlan({
      crop: plan.crop,
      area: plan.area,
      startDate: plan.startDate,
      endDate: plan.endDate,
      notes: plan.notes || ''
    });
    if (plan.startDate) setPlanStartDate(new Date(plan.startDate));
    if (plan.endDate) setPlanEndDate(new Date(plan.endDate));
    setEditingPlanId(plan.id);
    setShowAddPlan(true);
  };

  // Get product suggestions from store
  const getProductSuggestions = () => {
    if (!cropProducts || cropProducts.length === 0) {
      return [];
    }

    let filteredProducts = cropProducts;
    
    // Filter by selected category
    if (selectedCategory !== 'all') {
      filteredProducts = cropProducts.filter(p => 
        p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Return top 20 products
    return filteredProducts.slice(0, 20);
  };

  // Select product from store
  const selectProduct = (product) => {
    const priceInUGX = convertToUGX(parseFloat(product.price || 0));
    setNewBudgetItem({
      ...newBudgetItem,
      name: product.name,
      amount: priceInUGX.toString(),
      category: product.category || '',
      productId: product.id
    });
    setShowProductSuggestions(false);
  };

  // Add budget item
  const addBudgetItem = () => {
    if (!newBudgetItem.name || !newBudgetItem.amount) {
      Alert.alert('Missing Information', 'Please fill in name and amount');
      return;
    }

    const item = {
      ...newBudgetItem,
      id: Date.now(),
      amount: parseFloat(newBudgetItem.amount),
      createdAt: new Date().toISOString()
    };

    setBudgetItems([...budgetItems, item]);
    setNewBudgetItem({ name: '', amount: '', category: '', date: '', productId: null });
    setShowAddBudgetItem(false);
    addNotification(`Added budget item: ${item.name} - ${formatUGX(item.amount)}`, 'success');
    Alert.alert('Success', 'Budget item added successfully!');
  };

  // Delete budget item
  const deleteBudgetItem = (itemId) => {
    const item = budgetItems.find(i => i.id === itemId);
    Alert.alert(
      'Delete Budget Item',
      `Delete ${item?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBudgetItems(budgetItems.filter(i => i.id !== itemId));
            addNotification(`Deleted budget item: ${item?.name}`, 'warning');
          }
        }
      ]
    );
  };

  // Calculate total budget including plans and items
  const getTotalBudget = () => {
    const planTotal = cropPlans.reduce((sum, plan) => sum + (plan.budget || 0), 0);
    const itemTotal = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    return planTotal + itemTotal;
  };

  // Convert USD to Ugandan Shillings (UGX)
  const convertToUGX = (usdAmount) => {
    const exchangeRate = 3800; // 1 USD = ~3800 UGX (approximate rate)
    return Math.round(usdAmount * exchangeRate);
  };

  // Format currency in UGX
  const formatUGX = (amount) => {
    return `UGX ${amount.toLocaleString()}`;
  };

  // Get crop rotation recommendations
  const getCropRotationRecommendations = () => {
    if (!savedAnalyses || savedAnalyses.length === 0) {
      return [
        { crop: 'Maize', season: 'Spring', duration: '90 days', budget: formatUGX(convertToUGX(800)) + '/acre' },
        { crop: 'Beans', season: 'Summer', duration: '60 days', budget: formatUGX(convertToUGX(400)) + '/acre' },
        { crop: 'Wheat', season: 'Fall', duration: '120 days', budget: formatUGX(convertToUGX(600)) + '/acre' }
      ];
    }

    const cropTypes = [...new Set(savedAnalyses.map(analysis => analysis.crop))];
    const recommendations = [];
    
    cropTypes.forEach((crop, index) => {
      const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
      const season = seasons[index % seasons.length];
      const duration = crop === 'Maize' ? '90 days' : crop === 'Coffee' ? '180 days' : '60 days';
      const usdAmount = crop === 'Maize' ? 800 : crop === 'Coffee' ? 1200 : 400;
      const budget = formatUGX(convertToUGX(usdAmount)) + '/acre';
      
      recommendations.push({ crop, season, duration, budget });
    });
    
    return recommendations;
  };

  // pickImage function removed - gallery functionality disabled

  // takePhoto function removed - camera functionality disabled

  // analyzeImage function removed - disease detection disabled


  // Enhanced result display with business analysis
  // Helper function for severity colors
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      case 'critical':
        return '#9C27B0';
      default:
        return '#607D8B';
    }
  };

  const renderAnalysisResults = () => {
    if (!result) {
      console.log('No result to display');
      return null;
    }
    
    console.log('Rendering results with data:', result);
    
    // Extract data from new backend structure
    const analysis = result.analysis || {};
    const businessInsights = result.business_insights || {};
    
    console.log('Extracted analysis:', analysis);
    console.log('Extracted business insights:', businessInsights);
    
    return (
      <View style={styles.resultCard}>
        {/* Professional Header */}
        <View style={styles.resultHeader}>
          <MaterialIcons name="science" size={32} color="#2196F3" />
          <Text style={styles.resultTitle}>{t('analysis.title')}</Text>
          <Text style={styles.resultSubtitle}>{t('analysis.subtitle')}</Text>
        </View>
        
        {/* Crop Identification Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="eco" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>{t('analysis.cropIdentification')}</Text>
          </View>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>
              {analysis.crop_type || 'Unknown Crop'}
            </Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${(analysis.confidence * 100) || 0}%` }]} />
            </View>
            <Text style={styles.confidenceText}>
              Confidence: {(analysis.confidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.analysisMethod}>
              Detection Method: {analysis.analysis_method || 'Smart Detection'}
            </Text>
          </View>
        </View>
        
        {/* Health Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="favorite" size={24} color={analysis.health_status === 'healthy' ? '#4CAF50' : '#FF5722'} />
            <Text style={styles.sectionTitle}>{t('analysis.healthStatus')}</Text>
          </View>
          <View style={[styles.healthIndicator, { backgroundColor: analysis.health_status === 'healthy' ? '#E8F5E8' : '#FFEBEE' }]}>
            <Text style={[styles.healthText, { color: analysis.health_status === 'healthy' ? '#2E7D32' : '#C62828' }]}>
              {analysis.health_status === 'healthy' ? '🌱 Healthy Plant' : '🦠 Diseased Plant'}
            </Text>
          </View>
        </View>
        
        {/* Disease Detection */}
        {analysis.disease_type && analysis.disease_type !== 'none' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="warning" size={24} color="#FF9800" />
              <Text style={styles.sectionTitle}>{t('analysis.diseaseDetection')}</Text>
            </View>
            <Text style={styles.diseaseName}>
              Disease: {analysis.disease_type}
            </Text>
            <Text style={styles.severity}>
              Severity: {analysis.severity_level || 'Unknown'}
            </Text>
          </View>
        )}
        
        {/* Business Insights */}
        {businessInsights && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="business" size={24} color="#9C27B0" />
              <Text style={styles.sectionTitle}>{t('analysis.businessAnalysis')}</Text>
            </View>
            
            {/* Economic Impact */}
            {businessInsights.economic_impact && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.economicImpact')}</Text>
                <Text style={styles.infoText}>
                  {businessInsights.economic_impact}
                </Text>
              </View>
            )}
            
            {/* Risk Level */}
            {businessInsights.risk_level && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.riskAssessment')}</Text>
                <Text style={styles.infoText}>
                  Risk Level: {businessInsights.risk_level}
                </Text>
              </View>
            )}
            
            {/* Immediate Treatments */}
            {businessInsights.immediate_treatments && Array.isArray(businessInsights.immediate_treatments) && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.immediateTreatments')}</Text>
                {businessInsights.immediate_treatments.map((treatment, index) => (
                  <Text key={index} style={styles.treatmentText}>
                    {index + 1}. {treatment}
                  </Text>
                ))}
              </View>
            )}
            
            {/* Business Recommendations */}
            {businessInsights.business_recommendations && Array.isArray(businessInsights.business_recommendations) && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.businessRecommendations')}</Text>
                {businessInsights.business_recommendations.map((rec, index) => (
                  <Text key={index} style={styles.treatmentText}>
                    {index + 1}. {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Analysis Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={24} color="#607D8B" />
            <Text style={styles.sectionTitle}>{t('analysis.analysisDetails')}</Text>
          </View>
          <Text style={styles.infoText}>
            Timestamp: {result.timestamp || 'Unknown'}
          </Text>
          <Text style={styles.infoText}>
            Stakeholder: {result.stakeholder || 'Farmers'}
          </Text>
          <Text style={styles.infoText}>
            Success: {result.success ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoText}>
            Detection Method: {result.analysis?.analysis_method || 'Unknown'}
          </Text>
          {result.analysis?.api_source && result.analysis.api_source !== 'offline_detection' && (
            <Text style={styles.infoText}>
              Source: {result.analysis.api_source}
            </Text>
          )}
        </View>
        
        {/* AI Analysis Results */}
        {result.analysis?.symptoms && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="psychology" size={24} color="#9C27B0" />
              <Text style={styles.sectionTitle}>{t('analysis.aiAnalysisResults')}</Text>
            </View>
            
            {/* Symptoms */}
            {result.analysis.symptoms && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.symptoms')}</Text>
                <Text style={styles.infoText}>
                  {result.analysis.symptoms}
                </Text>
              </View>
            )}
            
            {/* Immediate Treatments */}
            {result.analysis.immediate_treatments && Array.isArray(result.analysis.immediate_treatments) && result.analysis.immediate_treatments.length > 0 && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.immediateTreatments')}</Text>
                {result.analysis.immediate_treatments.map((treatment, index) => (
                  <Text key={index} style={styles.treatmentText}>
                    {index + 1}. {treatment}
                  </Text>
                ))}
              </View>
            )}
            
            {/* Long-term Strategies */}
            {result.analysis.long_term_strategies && Array.isArray(result.analysis.long_term_strategies) && result.analysis.long_term_strategies.length > 0 && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.longTermStrategies')}</Text>
                {result.analysis.long_term_strategies.map((strategy, index) => (
                  <Text key={index} style={styles.treatmentText}>
                    {index + 1}. {strategy}
                  </Text>
                ))}
              </View>
            )}
            
            {/* Prevention */}
            {result.analysis.prevention && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>{t('analysis.prevention')}</Text>
                <Text style={styles.infoText}>
                  {result.analysis.prevention}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Product Recommendations */}
        {result.analysis?.disease_type && result.analysis.disease_type !== 'none' && (
          <ProductRecommendationCards
            diseaseType={result.analysis.disease_type}
            symptoms={result.analysis.symptoms ? [result.analysis.symptoms] : []}
            onProductPress={(product) => {
              console.log('Product selected:', product);
            }}
          />
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setResult(null)}>
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.actionButtonText}>{t('analysis.newAnalysis')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            // Share results functionality
            Alert.alert('Share Results', 'Results sharing feature coming soon!');
          }}>
            <MaterialIcons name="share" size={20} color="white" />
            <Text style={styles.actionButtonText}>{t('analysis.shareResults')}</Text>
          </TouchableOpacity>
        </View>
        

      </View>
    );
  };

  // Main Care screen
  const renderHomeScreen = () => (
    <View style={styles.screen}>
      {/* Main Content with ScrollView */}
      <ScrollView 
        style={styles.screenContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="eco" size={32} color="white" />
            <Text style={styles.headerTitle}> AGRON AI</Text>
          </View>
                      <Text style={styles.headerSubtitle}>{t('care.subtitle')}</Text>
          
          {/* System Status Indicator */}
          <View style={[styles.systemStatus, {
            backgroundColor:
              systemStatus === 'connected' ? '#4CAF50' :
              systemStatus === 'partial' ? '#2196F3' :
              systemStatus === 'error' ? '#f44336' : '#ff9800'
          }]}>
            <MaterialIcons
              name={
                systemStatus === 'connected' ? 'check-circle' :
                systemStatus === 'partial' ? 'sync' :
                systemStatus === 'error' ? 'error' : 'schedule'
              }
              size={16}
              color="white"
            />
            <Text style={styles.systemStatusText}>
              {systemStatus === 'connected' ? 'AGRON: Ready' :
               systemStatus === 'partial' ? 'AGRON: Starting' :
               systemStatus === 'error' ? 'AGRON: Offline' : 'AGRON: Starting...'}
            </Text>
          </View>
        </View>

        {/* Smart Farming Features */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <MaterialIcons name="smart-toy" size={24} color="#2c5530" />
            <Text style={styles.sectionTitle}> {t('care.smartFarming')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t('care.smartFarmingSubtitle')}</Text>
          
          <View style={styles.smartFarmingGrid}>
            <TouchableOpacity 
              style={[styles.smartFeatureButton, { backgroundColor: '#4CAF50' }]} 
              onPress={() => setCurrentTab('care')}
            >
              <MaterialIcons name="search" size={24} color="white" />
              <Text style={styles.smartFeatureText}>{t('care.diseaseDetection')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smartFeatureButton, { backgroundColor: '#FF9800' }]} 
              onPress={() => setCurrentTab('store')}
            >
              <MaterialIcons name="store" size={24} color="white" />
              <Text style={styles.smartFeatureText}>{t('care.marketConnect')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Identify section removed */}

        {/* Diagnose section removed */}

        {/* Blog section removed */}
        


        {/* Camera functionality removed */}
      </ScrollView>
    </View>
  );

  // renderGeneralFeedScreen function removed - blog/feed functionality completely removed

  // Plan tab with integrated features
  const renderPlanScreen = () => {





    return (
      <View style={styles.screen}>
        <View style={styles.tabHeader}>
          <View style={styles.tabTitleContainer}>
            <MaterialIcons name="assignment" size={28} color="white" />
                            <Text style={styles.tabTitle}> {t('plan.title')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <MaterialIcons name="notifications" size={24} color="white" />
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
                      <Text style={styles.tabSubtitle}>{t('plan.subtitle')}</Text>
        </View>
        
        {/* Plan Type Selector */}
        <View style={styles.planTypeSelector}>
          <TouchableOpacity 
            style={[styles.planTypeTab, selectedPlan === 'calendar' && styles.activePlanTypeTab]}
            onPress={() => setSelectedPlan('calendar')}
          >
            <MaterialIcons name="calendar-today" size={20} color={selectedPlan === 'calendar' ? 'white' : '#666'} />
            <Text style={[styles.planTypeText, selectedPlan === 'calendar' && styles.activePlanTypeText]}>{t('plan.calendar')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.planTypeTab, selectedPlan === 'rotation' && styles.activePlanTypeTab]}
            onPress={() => setSelectedPlan('rotation')}
          >
            <MaterialIcons name="autorenew" size={20} color={selectedPlan === 'rotation' ? 'white' : '#666'} />
            <Text style={[styles.planTypeText, selectedPlan === 'rotation' && styles.activePlanTypeText]}>{t('plan.rotation')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.planTypeTab, selectedPlan === 'budget' && styles.activePlanTypeTab]}
            onPress={() => setSelectedPlan('budget')}
          >
            <MaterialIcons name="account-balance-wallet" size={20} color={selectedPlan === 'budget' ? 'white' : '#666'} />
            <Text style={[styles.planTypeText, selectedPlan === 'budget' && styles.activePlanTypeText]}>{t('plan.budget')}</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {/* Calendar Planning */}
          {selectedPlan === 'calendar' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('plan.cropCalendarPlanning')}</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddPlan(true)}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>{t('plan.addPlan')}</Text>
                </TouchableOpacity>
              </View>
              
              {cropPlans.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="calendar-today" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>{t('plan.noPlans')}</Text>
                </View>
              ) : (
                cropPlans.map(plan => (
                  <View key={plan.id} style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <MaterialIcons name="local-florist" size={24} color="#4CAF50" />
                      <Text style={styles.planCrop}>{plan.crop}</Text>
                      <Text style={styles.planBudget}>{formatUGX(plan.budget)}</Text>
                    </View>
                    <Text style={styles.planDetails}>
                      Area: {plan.area} acres | {plan.startDate} to {plan.endDate}
                    </Text>
                    {plan.notes && <Text style={styles.planNotes}>{plan.notes}</Text>}
                    
                    {/* Action Buttons */}
                    <View style={styles.planActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => editCropPlan(plan)}
                      >
                        <MaterialIcons name="edit" size={18} color="#4CAF50" />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteCropPlan(plan.id)}
                      >
                        <MaterialIcons name="delete" size={18} color="#f44336" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Crop Rotation */}
          {selectedPlan === 'rotation' && (
            <View>
              <Text style={styles.sectionTitle}>{t('plan.cropRotationStrategy')}</Text>
              <Text style={styles.sectionSubtitle}>
                Based on your {savedAnalyses?.length || 0} crop analyses
              </Text>
              
              {getCropRotationRecommendations().map((rec, index) => {
                // Get appropriate icon based on crop type
                const getCropIcon = (cropName) => {
                  const crop = cropName.toLowerCase();
                  if (crop.includes('maize') || crop.includes('corn')) {
                    return <MaterialIcons name="eco" size={24} color="#4CAF50" />;
                  } else if (crop.includes('bean')) {
                    return <MaterialIcons name="circle" size={24} color="#FF9800" />;
                  } else if (crop.includes('wheat')) {
                    return <MaterialIcons name="grain" size={24} color="#8BC34A" />;
                  } else {
                    return <MaterialIcons name="agriculture" size={24} color="#4CAF50" />;
                  }
                };

                return (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      {getCropIcon(rec.crop)}
                      <Text style={styles.recommendationCrop}>{rec.crop}</Text>
                    </View>
                    <View style={styles.recommendationDetails}>
                      <Text style={styles.recommendationText}>Season: {rec.season}</Text>
                      <Text style={styles.recommendationText}>Duration: {rec.duration}</Text>
                      <Text style={styles.recommendationText}>Budget: {rec.budget}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Budget Planning */}
          {selectedPlan === 'budget' && (
            <View>
              <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('plan.budgetPlanning')}</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddBudgetItem(true)}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.budgetSummary}>
                <View style={styles.budgetCard}>
                  <Text style={styles.budgetLabel}>Total Budget</Text>
                  <Text style={styles.budgetAmount}>
                    {formatUGX(getTotalBudget())}
                  </Text>
                </View>
                <View style={styles.budgetCard}>
                  <Text style={styles.budgetLabel}>Crop Plans</Text>
                  <Text style={styles.budgetAmount}>
                    {formatUGX(cropPlans.reduce((sum, plan) => sum + plan.budget, 0))}
                  </Text>
                </View>
                <View style={styles.budgetCard}>
                  <Text style={styles.budgetLabel}>Other Items</Text>
                  <Text style={styles.budgetAmount}>
                    {formatUGX(budgetItems.reduce((sum, item) => sum + item.amount, 0))}
                  </Text>
                </View>
              </View>
              
              {/* Budget Items */}
              {budgetItems.length > 0 && (
                <View style={styles.budgetBreakdown}>
                  <Text style={styles.budgetBreakdownTitle}>Budget Items</Text>
                  {budgetItems.map(item => (
                    <View key={item.id} style={styles.budgetItemCard}>
                      <View style={styles.budgetItemHeader}>
                        <Text style={styles.budgetItemName}>{item.name}</Text>
                        <Text style={styles.budgetItemAmount}>{formatUGX(item.amount)}</Text>
                      </View>
                      {item.category && <Text style={styles.budgetItemCategory}>Category: {item.category}</Text>}
                      {item.date && <Text style={styles.budgetItemDate}>Date: {item.date}</Text>}
                      <TouchableOpacity
                        style={styles.budgetItemDelete}
                        onPress={() => deleteBudgetItem(item.id)}
                      >
                        <MaterialIcons name="delete" size={18} color="#f44336" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Crop Plans Budget */}
              {cropPlans.length > 0 && (
                <View style={styles.budgetBreakdown}>
                  <Text style={styles.budgetBreakdownTitle}>Crop Plans Budget</Text>
                  {cropPlans.map(plan => (
                    <View key={plan.id} style={styles.budgetItem}>
                      <Text style={styles.budgetItemCrop}>{plan.crop} ({plan.area} acres)</Text>
                      <Text style={styles.budgetItemAmount}>{formatUGX(plan.budget)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add Plan Modal */}
        <Modal
          visible={showAddPlan}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddPlan(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingPlanId ? 'Edit Crop Plan' : 'Add Crop Plan'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowAddPlan(false);
                  setEditingPlanId(null);
                  setNewPlan({ crop: '', area: '', startDate: '', endDate: '', budget: '', notes: '' });
                }}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={styles.input}
                  placeholder={t('form.cropType')}
                  value={newPlan.crop}
                  onChangeText={(text) => setNewPlan({...newPlan, crop: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('form.area')}
                  value={newPlan.area}
                  onChangeText={(text) => setNewPlan({...newPlan, area: text})}
                  keyboardType="numeric"
                />
                
                {/* Start Date Picker */}
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <MaterialIcons name="event" size={20} color="#4CAF50" />
                  <Text style={styles.dateButtonText}>
                    {newPlan.startDate || 'Select Start Date'}
                  </Text>
                </TouchableOpacity>
                
                {showStartDatePicker && (
                  <DateTimePicker
                    value={planStartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPlanStartDateChange}
                  />
                )}
                
                {/* End Date Picker */}
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <MaterialIcons name="event" size={20} color="#4CAF50" />
                  <Text style={styles.dateButtonText}>
                    {newPlan.endDate || 'Select End Date'}
                  </Text>
                </TouchableOpacity>
                
                {showEndDatePicker && (
                  <DateTimePicker
                    value={planEndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPlanEndDateChange}
                    minimumDate={planStartDate}
                  />
                )}
                
                <TextInput
                  style={styles.input}
                  placeholder={t('form.notes')}
                  value={newPlan.notes}
                  onChangeText={(text) => setNewPlan({...newPlan, notes: text})}
                  multiline
                />
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddPlan(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addCropPlan}
                >
                  <Text style={styles.saveButtonText}>Save Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Budget Item Modal */}
        <Modal
          visible={showAddBudgetItem}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddBudgetItem(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Budget Item</Text>
                <TouchableOpacity onPress={() => {
                  setShowAddBudgetItem(false);
                  setShowProductSuggestions(false);
                  setNewBudgetItem({ name: '', amount: '', category: '', date: '', productId: null });
                }}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {/* Product Suggestions Toggle */}
              <View style={styles.productSuggestionsHeader}>
                <TouchableOpacity
                  style={[styles.suggestionsToggle, showProductSuggestions && styles.suggestionsToggleActive]}
                  onPress={() => setShowProductSuggestions(!showProductSuggestions)}
                >
                  <MaterialIcons name="store" size={20} color={showProductSuggestions ? 'white' : '#4CAF50'} />
                  <Text style={[styles.suggestionsToggleText, showProductSuggestions && styles.suggestionsToggleTextActive]}>
                    {showProductSuggestions ? 'Hide' : 'Browse'} Store Products
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Product Suggestions */}
              {showProductSuggestions && (
                <View style={styles.productSuggestionsContainer}>
                  {/* Category Filter */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('all')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'seeds' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('seeds')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'seeds' && styles.categoryChipTextActive]}>
                        Seeds
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'fertilizer' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('fertilizer')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'fertilizer' && styles.categoryChipTextActive]}>
                        Fertilizers
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'tools' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('tools')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'tools' && styles.categoryChipTextActive]}>
                        Tools
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === 'pesticide' && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory('pesticide')}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === 'pesticide' && styles.categoryChipTextActive]}>
                        Pesticides
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>

                  {/* Product List */}
                  <ScrollView style={styles.productList}>
                    {getProductSuggestions().map((product, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.productSuggestionItem}
                        onPress={() => selectProduct(product)}
                      >
                        <View style={styles.productSuggestionContent}>
                          <Text style={styles.productSuggestionName}>{product.name}</Text>
                          <Text style={styles.productSuggestionCategory}>{product.category}</Text>
                        </View>
                        <View style={styles.productSuggestionPrice}>
                          <Text style={styles.productSuggestionPriceText}>
                            {formatUGX(convertToUGX(parseFloat(product.price || 0)))}
                          </Text>
                          <MaterialIcons name="add-circle" size={24} color="#4CAF50" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {/* Manual Input */}
              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={styles.input}
                  placeholder="Item Name (e.g., Seeds, Fertilizer)"
                  value={newBudgetItem.name}
                  onChangeText={(text) => setNewBudgetItem({...newBudgetItem, name: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Amount (UGX)"
                  value={newBudgetItem.amount}
                  onChangeText={(text) => setNewBudgetItem({...newBudgetItem, amount: text})}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category (optional)"
                  value={newBudgetItem.category}
                  onChangeText={(text) => setNewBudgetItem({...newBudgetItem, category: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date (optional)"
                  value={newBudgetItem.date}
                  onChangeText={(text) => setNewBudgetItem({...newBudgetItem, date: text})}
                />
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddBudgetItem(false);
                    setShowProductSuggestions(false);
                    setNewBudgetItem({ name: '', amount: '', category: '', date: '', productId: null });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addBudgetItem}
                >
                  <Text style={styles.saveButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notifications Panel */}
        {showNotifications && (
          <Modal
            visible={showNotifications}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowNotifications(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.notificationPanel}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <TouchableOpacity onPress={() => setShowNotifications(false)}>
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="notifications-none" size={48} color="#ccc" />
                      <Text style={styles.emptyStateText}>No notifications</Text>
                    </View>
                  ) : (
                    notifications.map(notif => (
                      <View 
                        key={notif.id} 
                        style={[
                          styles.notificationItem,
                          notif.type === 'success' && styles.notificationSuccess,
                          notif.type === 'warning' && styles.notificationWarning,
                          notif.type === 'error' && styles.notificationError
                        ]}
                      >
                        <MaterialIcons 
                          name={
                            notif.type === 'success' ? 'check-circle' :
                            notif.type === 'warning' ? 'warning' :
                            notif.type === 'error' ? 'error' : 'info'
                          } 
                          size={24} 
                          color={
                            notif.type === 'success' ? '#4CAF50' :
                            notif.type === 'warning' ? '#FF9800' :
                            notif.type === 'error' ? '#f44336' : '#2196F3'
                          }
                        />
                        <View style={styles.notificationContent}>
                          <Text style={styles.notificationMessage}>{notif.message}</Text>
                          <Text style={styles.notificationTime}>
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearNotificationsButton}
                    onPress={() => setNotifications([])}
                  >
                    <Text style={styles.clearNotificationsText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  // Saved tab with dynamic content
  const renderSavedScreen = () => (
    <View style={styles.screen}>
      <View style={styles.tabHeader}>
        <View style={styles.tabTitleContainer}>
          <MaterialIcons name="save" size={28} color="white" />
                          <Text style={styles.tabTitle}> Analysis History</Text>
        </View>
                  <Text style={styles.tabSubtitle}>Your crop analysis history</Text>
      </View>
    
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Recent Activities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Recent Activities</Text>
          {savedAnalyses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No scans completed yet. Start by analyzing your first crop image!</Text>
            </View>
          ) : (
            <View style={styles.activityCard}>
              <Text style={styles.activityText}>• Analyzed {savedAnalyses.length} crop images</Text>
              <Text style={styles.activityText}>• Detected {savedAnalyses.filter(a => a.disease && a.disease !== 'No disease detected').length} disease cases</Text>
              <Text style={styles.activityText}>• Saved {savedAnalyses.length} treatment recommendations</Text>
              <Text style={styles.activityText}>• Completed {cropPlans.length} farm planning sessions</Text>
            </View>
          )}
        </View>

        {/* Crop Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Crop Overview</Text>
          <View style={styles.cropGrid}>
            {cropProducts.map((crop) => (
              <View key={crop.id} style={styles.cropItem}>
                <Image source={crop.image} style={styles.cropImage} />
                <Text style={styles.cropLabel}>{crop.name}</Text>
                <Text style={styles.cropCount}>{savedAnalyses.filter(a => a.crop === crop.name).length} analyses</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Saved Images section removed */}
      </ScrollView>
    </View>
  );



  // Account tab
  const renderAccountScreen = () => (
    <View style={styles.screen}>
      <View style={styles.tabHeader}>
        <View style={styles.tabTitleContainer}>
          <MaterialIcons name="account-circle" size={28} color="white" />
          <Text style={styles.tabTitle}> My Account</Text>
        </View>
        <Text style={styles.tabSubtitle}>Manage your AGRON account and profile</Text>
      </View>
      
      <ScrollView 
        style={styles.tabContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.welcomeAccountCard}>
            {/* Profile Photo */}
            <TouchableOpacity 
              style={styles.profilePhotoContainer}
              onPress={isEditingProfile ? handlePickImage : null}
              disabled={!isEditingProfile}
            >
              {(editableUserData.profilePhoto || currentUser?.profilePhoto) ? (
                <Image 
                  key={editableUserData.profilePhoto || currentUser?.profilePhoto}
                  source={{ uri: editableUserData.profilePhoto || currentUser?.profilePhoto }} 
                  style={styles.profilePhoto}
                  onError={(error) => {
                    console.log('⚠️ Account Tab: Profile photo failed to load');
                    console.log('   Error:', error.nativeEvent?.error);
                    console.log('   URL:', editableUserData.profilePhoto || currentUser?.profilePhoto);
                  }}
                  onLoad={() => {
                    console.log('✅ Account Tab: Profile photo loaded successfully!');
                    console.log('   URL:', (editableUserData.profilePhoto || currentUser?.profilePhoto)?.substring(0, 100));
                  }}
                  onLoadStart={() => {
                    console.log('⏳ Account Tab: Starting to load profile photo...');
                  }}
                />
              ) : (
                <MaterialIcons name="account-circle" size={80} color="#4CAF50" />
              )}
              {isEditingProfile && (
                <View style={styles.editPhotoOverlay}>
                  <MaterialIcons name="camera-alt" size={24} color="white" />
              </View>
              )}
            </TouchableOpacity>

            {/* User Info */}
            {isEditingProfile ? (
              <View style={styles.editProfileSection}>
                <Text style={styles.editLabel}>Full Name</Text>
                <TextInput
                  style={[styles.editInput, styles.disabledInput]}
                  value={currentUser?.fullName || ''}
                  editable={false}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                />
                <Text style={styles.editHint}>Your full name from registration</Text>

                <Text style={styles.editLabel}>Email</Text>
                <TextInput
                  style={[styles.editInput, styles.disabledInput]}
                  value={currentUser?.email || ''}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#999"
                />
                <Text style={styles.editHint}>📧 Email cannot be changed</Text>

                <Text style={styles.editLabel}>Phone Number</Text>
                <TextInput
                  style={styles.editInput}
                  value={editableUserData.phone}
                  onChangeText={(text) => setEditableUserData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
                <Text style={styles.editHint}>📱 Changing phone requires email verification</Text>

                <Text style={styles.editLabel}>Username (Display Name)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editableUserData.username}
                  onChangeText={(text) => setEditableUserData(prev => ({ ...prev, username: text }))}
                  placeholder="Enter your username"
                  placeholderTextColor="#999"
                />
                <Text style={styles.editHint}>✏️ You can change your username anytime</Text>

                {/* Save/Cancel Buttons */}
                <View style={styles.editButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
            </View>
              </View>
            ) : (
              <View style={styles.profileInfoSection}>
                {/* Full Name from Registration */}
                <Text style={styles.welcomeTitle}>{currentUser?.fullName || 'AGRON User'}</Text>
                
                {/* Email */}
                <View style={styles.profileInfoRow}>
                  <MaterialIcons name="email" size={16} color="#666" />
                  <Text style={styles.welcomeEmail}>{currentUser?.email || ''}</Text>
                </View>
                
                {/* Phone Number */}
                {currentUser?.phone && (
                  <View style={styles.profileInfoRow}>
                    <MaterialIcons name="phone" size={16} color="#666" />
                    <Text style={styles.welcomePhone}>{currentUser.phone}</Text>
                  </View>
                )}
                
                {/* Username (if different from full name) */}
                {currentUser?.username && currentUser.username !== currentUser.fullName && (
                  <View style={styles.profileInfoRow}>
                    <MaterialIcons name="person" size={16} color="#666" />
                    <Text style={styles.welcomeUsername}>@{currentUser.username}</Text>
                  </View>
                )}
                
                {/* Edit Profile Button */}
                <TouchableOpacity 
                  style={styles.editProfileButton}
                  onPress={() => setIsEditingProfile(true)}
                >
                  <MaterialIcons name="edit" size={16} color="#4CAF50" />
                  <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>AGRON Balance</Text>
              <Text style={styles.balanceAmount}>UGX 0</Text>
            </View>
          </View>
        </View>

        {/* Authentication Status */}
        {isAuthenticated && (
          <View style={styles.section}>
            <View style={styles.authStatusCard}>
              <MaterialIcons name="verified" size={24} color="#4CAF50" />
              <View style={styles.authStatusInfo}>
                <Text style={styles.authStatusTitle}>Account Verified</Text>
                <Text style={styles.authStatusSubtitle}>
                  {isEmailVerified ? 'Email verified' : 'Email verification pending'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={20} color="#F44336" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Subscription Status */}
        {isAuthenticated && (
          <SubscriptionStatusCard onSubscribe={() => setCurrentAccountScreen('Payment')} />
        )}

        {/* My Orders Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Activity</Text>
            
            <TouchableOpacity style={styles.activityCard}>
              <View style={styles.activityIconContainer}>
                <MaterialIcons name="shopping-cart" size={28} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>My Orders</Text>
                <Text style={styles.activitySubtitle}>Track your purchases</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityCard}>
              <View style={styles.activityIconContainer}>
                <MaterialIcons name="favorite" size={28} color="#FF5722" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Wishlist</Text>
                <Text style={styles.activitySubtitle}>Saved items</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.activityCard}>
              <View style={styles.activityIconContainer}>
                <MaterialIcons name="history" size={28} color="#2196F3" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Purchase History</Text>
                <Text style={styles.activitySubtitle}>View past orders</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* P2P Market Panel - Only for registered buyers/sellers */}
        {(currentUser?.userType === 'buyer' || currentUser?.userType === 'seller' || currentUser?.userType === 'both') && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>My P2P Market</Text>
            
            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => setCurrentAccountScreen('P2PMarketPanel')}
            >
              <View style={styles.activityIconContainer}>
                <MaterialIcons name="storefront" size={24} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>P2P Market Dashboard</Text>
                <Text style={styles.activitySubtitle}>
                  Manage listings, view messages, track sales
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            {/* Messages Inbox */}
            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => setCurrentAccountScreen('MessagesInbox')}
            >
              <View style={styles.activityIconContainer}>
                <MaterialIcons name="chat" size={24} color="#7C4DFF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Messages</Text>
                <Text style={styles.activitySubtitle}>
                  Encrypted conversations with buyers &amp; sellers
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            {/* Post Buy Request Button - For ALL users */}
            <TouchableOpacity
              style={styles.activityItem}
              onPress={() => setCurrentAccountScreen('CreateBuyRequest')}
            >
              <View style={styles.activityIconContainer}>
                <MaterialIcons name="add-shopping-cart" size={24} color="#2196F3" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Post Buy Request</Text>
                <Text style={styles.activitySubtitle}>
                  Tell sellers what you want to buy
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            {/* Browse Buy Requests Button - For SELLERS only */}
            {(currentUser?.userType === 'seller' || currentUser?.userType === 'both') && (
              <TouchableOpacity
                style={styles.activityItem}
                onPress={() => setCurrentAccountScreen('BrowseBuyRequests')}
              >
                <View style={styles.activityIconContainer}>
                  <MaterialIcons name="search" size={24} color="#FF9800" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Browse Buy Requests</Text>
                  <Text style={styles.activitySubtitle}>
                    See what buyers are looking for
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Buyer/Seller Registration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join the AGRON Marketplace</Text>
          
          <View style={styles.sellerCard}>
            <MaterialIcons name="store" size={40} color="#4CAF50" />
            <Text style={styles.sellerTitle}>Become a Buyer or Seller</Text>
            <Text style={styles.sellerDescription}>
              Join our marketplace to buy or sell agricultural products and reach thousands of farmers across Uganda!
            </Text>
            
            <TouchableOpacity 
              style={styles.sellerButton}
              onPress={() => {
                Alert.alert(
                  '👥 Join AGRON Marketplace',
                  'Choose how you want to participate:',
                  [
                    { 
                      text: '🛒 Register as Buyer', 
                      onPress: () => {
                        setCurrentAccountScreen('BuyerRequest');
                      }
                    },
                    { 
                      text: '🏪 Register as Seller', 
                      onPress: () => {
                        setCurrentAccountScreen('SellerRequest');
                      }
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <MaterialIcons name="how-to-reg" size={20} color="white" />
              <Text style={styles.sellerButtonText}>Register Now</Text>
            </TouchableOpacity>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactRow}>
                <MaterialIcons name="email" size={18} color="#666" />
                <Text style={styles.contactText}>support@agrof.farm</Text>
              </View>
              <View style={styles.contactRow}>
                <MaterialIcons name="phone" size={18} color="#666" />
                <Text style={styles.contactText}>+256 705 223 777</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Assistance?</Text>
          
          <TouchableOpacity 
            style={styles.assistanceItem}
            onPress={() => Alert.alert('FAQs', 'Frequently Asked Questions coming soon!')}
          >
            <MaterialIcons name="help-outline" size={24} color="#4CAF50" />
            <Text style={styles.assistanceItemText}>FAQs</Text>
            <MaterialIcons name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.assistanceItem}
            onPress={() => {
              Linking.openURL('mailto:support@agrof.farm?subject=AGRON Support Request');
            }}
          >
            <MaterialIcons name="email" size={24} color="#4CAF50" />
            <Text style={styles.assistanceItemText}>Email Support</Text>
            <MaterialIcons name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.assistanceItem}
            onPress={() => {
              Linking.openURL('tel:+256705223777');
            }}
          >
            <MaterialIcons name="phone" size={24} color="#4CAF50" />
            <Text style={styles.assistanceItemText}>Call Support</Text>
            <MaterialIcons name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.assistanceItem}
            onPress={() => Alert.alert('Live Chat', 'Chat support coming soon!')}
          >
            <MaterialIcons name="chat" size={24} color="#4CAF50" />
            <Text style={styles.assistanceItemText}>Live Chat</Text>
            <MaterialIcons name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="visibility" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Recently Viewed</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="search" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Recently Searched</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* My Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Settings</Text>
          
          {/* Language Switcher */}
          <View style={styles.languageSwitcherCard}>
            <View style={styles.languageSwitcherHeader}>
              <MaterialIcons name="language" size={24} color="#4CAF50" />
              <Text style={styles.languageSwitcherTitle}>Language Settings</Text>
            </View>
            <LanguageSwitcher style={styles.languageSwitcherInCard} showLabel={true} />
          </View>
          
          {/* Real Logout Button */}
          <TouchableOpacity 
            style={[styles.accountItem, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#F44336" />
            <Text style={[styles.accountItemText, { color: '#F44336', fontWeight: 'bold' }]}>
              Logout & Clear Data
            </Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );

  // About AGRON screen
  const renderAboutAgrofScreen = () => (
    <View style={styles.screen}>
      <View style={styles.tabHeader}>
        <View style={styles.tabTitleContainer}>
          <TouchableOpacity onPress={() => setCurrentAccountScreen('main')}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.tabTitle}> About AGRON</Text>
        </View>
        <Text style={styles.tabSubtitle}>Learn about AGRON services and support</Text>
      </View>
      
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* AGRON Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AGRON Services</Text>
          
          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="storefront" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Sell on AGRON</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="contact-phone" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Contact Us</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Help Center */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.assistanceCard}
            onPress={() => setCurrentAccountScreen('help')}
          >
            <MaterialIcons name="help-center" size={30} color="#4CAF50" />
            <View style={styles.assistanceContent}>
              <Text style={styles.assistanceTitle}>Help Center</Text>
              <Text style={styles.assistanceSubtitle}>Get help with orders, payments, and more</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // Help Center screen
  const renderHelpCenterScreen = () => (
    <View style={styles.screen}>
      <View style={styles.tabHeader}>
        <View style={styles.tabTitleContainer}>
          <TouchableOpacity onPress={() => setCurrentAccountScreen('about')}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.tabTitle}> Help Center</Text>
        </View>
        <Text style={styles.tabSubtitle}>Get help with your AGRON experience</Text>
      </View>
      
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Order Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Management</Text>
          
          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="track-changes" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Track Your Order</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="shopping-cart" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Place an Order</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="payment" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Pay for Order</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="cancel" size={24} color="#FF5722" />
            <Text style={[styles.accountItemText, { color: '#FF5722' }]}>Cancel Order</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="assignment-return" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Create a Return</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Support Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Topics</Text>
          
          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="help" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Frequently Asked Questions</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="payment" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Payment</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="local-shipping" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Delivery</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="inventory" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Products</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="account-circle" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Account</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="storefront" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Sell on AGRON</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="security" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Warranty</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="chat" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Live Chat</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="phone" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Call: +256 700 123 456</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <MaterialIcons name="email" size={24} color="#4CAF50" />
            <Text style={styles.accountItemText}>Email: support@agrof.com</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // Consult tab - AGRON Bot AI assistant removed
  const renderConsultScreen = () => (
    <View style={styles.screen}>
      <View style={styles.tabHeader}>
        <View style={styles.tabTitleContainer}>
          <MaterialIcons name="smart-toy" size={28} color="white" />
          <Text style={styles.tabTitle}> Expert Consultation</Text>
        </View>
        <Text style={styles.tabSubtitle}>Agricultural consultation services</Text>
      </View>
      
      {/* AGRON Bot AI assistant dashboard removed */}
      <View style={styles.consultContent}>
        <Text style={styles.consultMessage}>
          Expert consultation services are currently being updated. 
          Please check back later for AI-powered agricultural assistance.
        </Text>
      </View>
    </View>
  );

  // Navigation tabs
  const renderNavigationTabs = () => {
    
    return (
      <View style={styles.navigationTabs}>
        {/* Home tab - Smart farming dashboard */}
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'home' && styles.activeTab]} 
          onPress={() => {
            console.log('Home tab pressed, current tab:', currentTab);
            setNavigationStack([]); // Clear navigation stack
            setCurrentTab('home');
          }}
        >
          <MaterialIcons 
            name="home" 
            size={24} 
            color={currentTab === 'home' ? '#4CAF50' : '#666'} 
            style={styles.tabIcon} 
          />
          <Text style={[styles.tabLabel, currentTab === 'home' && styles.activeTabLabel]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'plan' && styles.activeTab]} 
          onPress={() => {
            console.log('Plan tab pressed, current tab:', currentTab);
            setNavigationStack([]); // Clear navigation stack
            setCurrentTab('plan');
          }}
        >
          <MaterialIcons 
            name="assignment" 
            size={24} 
            color={currentTab === 'plan' ? '#4CAF50' : '#666'} 
            style={styles.tabIcon} 
          />
          <Text style={[styles.tabLabel, currentTab === 'plan' && styles.activeTabLabel]}>AI Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'care' && styles.activeTab]} 
          onPress={() => {
            console.log('Care tab pressed, current tab:', currentTab);
            setNavigationStack([]); // Clear navigation stack
            setCurrentTab('care');
          }}
        >
          <MaterialIcons 
            name="psychology" 
            size={24} 
            color={currentTab === 'care' ? '#4CAF50' : '#666'} 
            style={styles.tabIcon} 
          />
          <Text style={[styles.tabLabel, currentTab === 'care' && styles.activeTabLabel]}>AI Care</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'stocks' && styles.activeTab]} 
          onPress={() => {
            console.log('Stocks tab pressed, current tab:', currentTab);
            setNavigationStack([]);
            setP2pSubScreen(null);
            setP2pListing(null);
            setCurrentTab('stocks');
          }}
        >
          <MaterialIcons 
            name="trending-up" 
            size={24} 
            color={currentTab === 'stocks' ? '#4CAF50' : '#666'} 
            style={styles.tabIcon} 
          />
          <Text style={[styles.tabLabel, currentTab === 'stocks' && styles.activeTabLabel]}>Blocker</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'store' && styles.activeTab]} 
          onPress={() => {
            console.log('Store tab pressed, current tab:', currentTab);
            setNavigationStack([]);
            setAgronSubScreen(null);
            setAgronCategory(null);
            setAgronProduct(null);
            setSelectedMerchantStore(null);
            setCurrentTab('store');
          }}
        >
          <MaterialIcons 
            name="store" 
            size={24} 
            color={currentTab === 'store' ? '#4CAF50' : '#666'} 
            style={styles.tabIcon} 
          />
          <Text style={[styles.tabLabel, currentTab === 'store' && styles.activeTabLabel]}>Store</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentTab === 'account' && styles.activeTab]} 
          onPress={() => {
            console.log('Account tab pressed, current tab:', currentTab);
            setNavigationStack([]); // Clear navigation stack
            setCurrentTab('account');
          }}
        >
          <MaterialIcons 
            name="person" 
            size={24} 
            color={currentTab === 'account' ? '#4CAF50' : '#666'} 
            style={styles.tabIcon} 
          />
          <Text style={[styles.tabLabel, currentTab === 'account' && styles.activeTabLabel]}>Account</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCareSubTabs = () => {
    if (currentTab !== 'care') return null;
    
    return (
      <View style={styles.subTabs}>
        
        {/* General Feed tab removed */}
      </View>
    );
  };

  // Navigation functions
  const navigate = (screen, params = {}) => {
    setNavigationStack(prev => [...prev, { screen, params }]);
  };

  const goBack = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  const getCurrentScreen = () => {
    if (navigationStack.length > 0) {
      const current = navigationStack[navigationStack.length - 1];
      return { screen: current.screen, params: current.params };
    }
    return null;
  };

  const renderTabContent = () => {
    console.log('Rendering tab content for currentTab:', currentTab);
    const currentNav = getCurrentScreen();
    
    // Render Chat Screen
    if (currentNav && currentNav.screen === 'chat') {
      return <ChatScreen 
        route={{ params: currentNav.params }} 
        navigation={{ navigate, goBack }} 
      />;
    }
    
    // Render Product Trading Screen
    if (currentNav && currentNav.screen === 'ProductTrading') {
      return <ProductTradingScreen 
        route={{ params: currentNav.params }} 
        navigation={{ navigate, goBack }} 
      />;
    }
    
    // Render Inquiry Form Screen
    if (currentNav && currentNav.screen === 'InquiryForm') {
      return <InquiryFormScreen 
        route={{ params: currentNav.params }} 
        navigation={{ navigate, goBack }} 
      />;
    }

    
    // Home tab - shows smart farming dashboard with navigation
    if (currentTab === 'home') {
      console.log('Rendering home screen');
      return renderHomeScreen();
    }
    
    // Consult tab removed - functionality moved to bot image
    if (currentTab === 'plan') {
      console.log('Rendering plan screen');
      return renderPlanScreen();
    }
    if (currentTab === 'care') {
      console.log('Rendering care screen');
      // Feed screen removed
      // Dashboard and IoT monitoring removed
      if (currentScreen === 'disease-detection') return <DiseaseDetectionScreen navigation={{ navigate: navigateToAuth, goBack: () => setCurrentTab('care') }} />;
      // Default to disease detection screen
      return <DiseaseDetectionScreen navigation={{ navigate: navigateToAuth, goBack: () => setCurrentTab('care') }} />;
    }
    if (currentTab === 'stocks') {
      if (p2pSubScreen === 'inquiry' && p2pListing) {
        return (
          <InquiryFormScreen
            navigation={{
              goBack: () => { setP2pSubScreen(null); setP2pListing(null); },
              navigate: (screen, params) => {
                setScreenParams(params);
                setCurrentAccountScreen(screen);
                setCurrentTab('account');
              },
            }}
            route={{
              params: {
                listing: p2pListing,
                seller: {
                  uid: p2pListing.sellerSub,
                  id: p2pListing.sellerSub,
                  fullName: p2pListing.sellerName || 'Farmer',
                },
                p2pProduct: { id: p2pListing.id, name: p2pListing.title },
              },
            }}
          />
        );
      }
      return (
        <P2PProductsScreen
          navigation={{
            navigate: (screen, params) => {
              if (screen === 'InquiryForm') {
                setP2pListing(params?.listing ?? null);
                setP2pSubScreen('inquiry');
              } else if (screen === 'Payment') {
                setCurrentTab('account');
                setCurrentAccountScreen('Payment');
              }
            },
          }}
        />
      );
    }
    if (currentTab === 'store') {
      // Deep: product detail
      if (agronSubScreen === 'product' && agronProduct) {
        return (
          <AgronProductScreen
            product={agronProduct}
            onBack={() => { setAgronSubScreen('category'); setAgronProduct(null); }}
          />
        );
      }
      // Deep: Agron category
      if (agronSubScreen === 'category' && agronCategory) {
        return (
          <AgronCategoryScreen
            categorySlug={agronCategory}
            onBack={() => { setAgronSubScreen('agron-home'); setAgronCategory(null); }}
            onProductPress={(product) => { setAgronProduct(product); setAgronSubScreen('product'); }}
          />
        );
      }
      // Agron store home (categories grid)
      if (agronSubScreen === 'agron-home') {
        return (
          <AgronStoreLanding
            onCategoryPress={(slug) => { setAgronCategory(slug); setAgronSubScreen('category'); }}
            onBack={() => setAgronSubScreen(null)}
          />
        );
      }
      // Merchant (registered) store
      if (agronSubScreen === 'merchant-store' && selectedMerchantStore) {
        return (
          <RegisteredStoreScreen
            store={selectedMerchantStore}
            onBack={() => { setAgronSubScreen(null); setSelectedMerchantStore(null); }}
          />
        );
      }
      // Default: multi-store directory
      return (
        <StoreDirectoryLanding
          onAgronPress={() => setAgronSubScreen('agron-home')}
          onMerchantStorePress={(store) => { setSelectedMerchantStore(store); setAgronSubScreen('merchant-store'); }}
        />
      );
    }
    if (currentTab === 'account') {
      console.log('Rendering account screen');
      return (
        <AuthGate 
          tabName="Account"
          onAuthSuccess={handleAuthSuccess}
          navigation={{ navigate: navigateToAuth }}
          showSoftGate={true}
          softGateAttempts={2}
        >
          {currentAccountScreen === 'about' ? renderAboutAgrofScreen() : 
           currentAccountScreen === 'help' ? renderHelpCenterScreen() : 
           currentAccountScreen === 'BuyerRequest' ? <BuyerRequestScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: setCurrentTab }} /> :
           currentAccountScreen === 'SellerRequest' ? <SellerRequestScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} /> :
           currentAccountScreen === 'P2PMarketPanel' ? <P2PMarketPanel navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} /> :
           currentAccountScreen === 'ProductSelection' ? <ProductSelectionScreen navigation={{ goBack: () => setCurrentAccountScreen('P2PMarketPanel'), navigate: (screen, params) => { console.log('📍 Navigating to:', screen, 'with params:', params); setScreenParams(params); setCurrentAccountScreen(screen); } }} route={{ params: screenParams }} /> :
           currentAccountScreen === 'PriceQuantityInput' ? <PriceQuantityInputScreen navigation={{ goBack: () => setCurrentAccountScreen('ProductSelection'), navigate: (screen, params) => { if (params) setScreenParams(params); setCurrentAccountScreen(screen); } }} route={{ params: screenParams }} /> :
           currentAccountScreen === 'CreateBuyRequest' ? <CreateBuyRequestScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} /> :
           currentAccountScreen === 'BrowseBuyRequests' ? <BrowseBuyRequestsScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} /> :
           currentAccountScreen === 'BuyRequestDetails' ? <BuyRequestDetailsScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} route={{ params: screenParams }} /> :
           currentAccountScreen === 'Conversation' ? <ConversationScreen navigation={{ goBack: () => setCurrentAccountScreen('MessagesInbox'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} route={{ params: screenParams }} /> :
           currentAccountScreen === 'MessagesInbox' ? <MessagesInboxScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} /> :
           currentAccountScreen === 'Payment' ? <PaymentScreen navigation={{ goBack: () => setCurrentAccountScreen('main'), navigate: (screen, params) => { setScreenParams(params); setCurrentAccountScreen(screen); } }} /> :
           renderAccountScreen()}
        </AuthGate>
      );
    }
    
    console.log('Rendering default home screen');
    return renderHomeScreen();
  };

  // AI training functionality removed

  // Get background image based on current screen and tab
  const getBackgroundImage = () => {
    console.log('🎨 Background Debug - currentTab:', currentTab, 'currentScreen:', currentScreen);
    
    // Use 'welcome' background for: Home, AI Care, AI Plan, and Store tabs
    if (currentTab === 'home' || currentTab === 'care' || currentTab === 'store') {
      console.log('🎨 Using welcome background for', currentTab, 'tab');
      return 'welcome';     // Unified background for main tabs
    }
    
    // Analysis and results screens (if used)
    if (currentScreen === 'analysis') {
      console.log('🎨 Using fungicides background for analysis screen');
      return 'fungicides';  // Analysis screen - fungicides background
    }
    if (currentScreen === 'results') {
      console.log('🎨 Using herbicides background for results screen');
      return 'herbicides';  // Results screen - herbicides background
    }
    if (currentScreen === 'nursery') {
      console.log('🎨 Using nursery background for nursery screen');
      return 'nursery';     // Nursery screen - nursery bed background
    }
    
    // Default fallback
    console.log('🎨 Using default welcome background');
    return 'welcome';
  };

  // Prepare navigation for auth screens
  const authNavigation = {
    navigate: (screen, params) => {
      if (params) setAuthScreenParams(params);
      else setAuthScreenParams({});
      setShowAuthScreen(screen);
    },
    goBack: () => {
      setAuthScreenParams({});
      setShowAuthScreen(null);
    },
    onAuthSuccess: handleAuthSuccess  // Pass auth success handler
  };

  // Render authentication screens or main app
  const renderAuthScreen = () => {
    const screen = (() => {
      switch (showAuthScreen) {
        case 'login':
          return <LoginScreen navigation={authNavigation} />;
        case 'signup':
          return <SignupScreen navigation={authNavigation} />;
        case 'verification':
          return (
            <EmailVerificationScreen
              navigation={authNavigation}
              route={{ params: authScreenParams }}
            />
          );
        default:
          return null;
      }
    })();

  return (
      <View style={{ flex: 1, backgroundColor: '#e8f5e9' }}>
        <StatusBar style="dark" />
        {screen}
      </View>
    );
  };

  // Wait for fonts to load
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 20, color: '#333', fontSize: 16 }}>Loading AGRON...</Text>
      </View>
    );
  }

  // If showing auth screen, render it instead of main app
  if (showAuthScreen) {
    return renderAuthScreen();
  }

  // Main app render
  return (
    <View style={{ flex: 1, backgroundColor: '#e8f5e9' }}>
    <QueryProvider>
    <UserProvider>
    <SubscriptionProvider>
    <LanguageProvider>
      <CartProvider key={languageKey}>
        <BackgroundImage overlayOpacity={0.4} backgroundImage={getBackgroundImage()}>
        <StatusBar style="auto" />
        
        {renderTabContent()}
        
        {renderCareSubTabs()}
        
        {renderNavigationTabs()}
        
        {/* ChatBot Button - Available on all screens */}
        <ChatBotButton onPress={() => setShowChatbot(true)} />
        
        {/* Chatbot Modal */}
        {showChatbot && (
          <Modal
            visible={showChatbot}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <View style={styles.chatbotModal}>
              {/* Solid background color instead of image for instant display */}
              <View style={styles.chatbotBackground}>
                {/* Optional: Keep image but load it after with fade */}
              <Image 
                source={require('./assets/care.png')} 
                style={styles.chatbotBackgroundImage}
                resizeMode="cover"
                  fadeDuration={0}
                  defaultSource={require('./assets/care.png')}
              />
              </View>
              
              {/* Content Overlay */}
              <View style={styles.chatbotOverlay}>
                <View style={styles.chatbotHeader}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowChatbot(false)}
                  >
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.chatbotTitle}>AGRON AI Assistant</Text>
                </View>
                <ChatBot onShowTraining={() => setShowChatbot(false)} />
              </View>
            </View>
          </Modal>
        )}
        
        {/* Futuristic AI Analysis Screen component was removed */}
      </BackgroundImage>
      </CartProvider>
    </LanguageProvider>
    </SubscriptionProvider>
    </UserProvider>
    </QueryProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'center',
  },
  systemStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  welcomeOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  languageSwitcherContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  languageSwitcherCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageSwitcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageSwitcherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  languageSwitcherInCard: {
    marginTop: 0,
  },
  // Welcome screens
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  welcomeBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  welcomeFullScreenImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  welcomeOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  agrofLogoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1000,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginHorizontal: 30,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  planTypeSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  planTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activePlanTypeTab: {
    backgroundColor: '#4CAF50',
  },
  planTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  activePlanTypeText: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
    flex: 1,
  },
  planBudget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  planDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  planNotes: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationPanel: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  notificationList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationSuccess: {
    borderLeftColor: '#4CAF50',
  },
  notificationWarning: {
    borderLeftColor: '#FF9800',
  },
  notificationError: {
    borderLeftColor: '#f44336',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  clearNotificationsButton: {
    padding: 16,
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  clearNotificationsText: {
    color: 'white',
    fontWeight: '600',
  },
  budgetItemCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    flex: 1,
  },
  budgetItemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  budgetItemDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  budgetItemDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  productSuggestionsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  suggestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'white',
  },
  suggestionsToggleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  suggestionsToggleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  suggestionsToggleTextActive: {
    color: 'white',
  },
  productSuggestionsContainer: {
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  productList: {
    maxHeight: 200,
    padding: 8,
  },
  productSuggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  productSuggestionContent: {
    flex: 1,
  },
  productSuggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSuggestionCategory: {
    fontSize: 13,
    color: '#666',
  },
  productSuggestionPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productSuggestionPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 8,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
  },
  recommendationDetails: {
    marginLeft: 32,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  budgetSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  budgetCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  budgetBreakdown: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  budgetBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  budgetItemCrop: {
    fontSize: 14,
    color: '#333',
  },
  budgetItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
  },
  modalBody: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },


  disabledButton: {
    backgroundColor: '#ccc',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  screenSubtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryList: {
    flex: 1,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCategory: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },

  manualContainer: {
    flex: 1,
    marginBottom: 20,
  },
  manualStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Background video styles - REMOVED
  screenContent: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 15,
  },

  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  // Identify and camera button styles removed
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  
  // Enhanced Result Styles
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cropInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 10,
    textAlign: 'center',
  },
  confidenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  analysisMethod: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  healthIndicator: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  healthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  diseaseInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  severityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  economicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  economicItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  economicLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  economicValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  postHarvestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  postHarvestItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  postHarvestLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  postHarvestValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  treatmentsList: {
    marginBottom: 15,
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  treatmentNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  treatmentNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  businessList: {
    marginBottom: 15,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 6,
  },
  businessText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  insightsList: {
    marginBottom: 15,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 6,
  },
  insightsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  severity: {
    fontSize: 14,
    color: '#666',
  },
  detailedInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginTop: 10,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  // Diagnose styles removed
  blogScroll: {
    marginTop: 10,
  },
  blogCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    width: 150,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  blogIcon: {
    textAlign: 'center',
    marginBottom: 8,
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  blogDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  nextSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#FF5722',
    marginTop: 10,
  },
  // Tab styles
  tabHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tabTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeSubTab: {
    backgroundColor: '#4CAF50',
  },
  subTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  subTabIcon: {
    marginRight: 5,
  },
  activeSubTabText: {
    color: 'white',
  },
  // Feature cards
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    textAlign: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  featureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Activity and graph styles
  activityCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  graphCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  graphBar: {
    marginBottom: 15,
  },
  graphBarFill: {
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginBottom: 5,
  },
  graphLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Crop grid styles
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  cropItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
    borderRadius: 25,
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 4,
    textAlign: 'center',
  },
  cropCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  savedIcon: {
    marginRight: 15,
  },
  savedContent: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  savedDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Settings styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataUsageCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataUsageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataUsageBar: {
    marginBottom: 15,
  },
  dataUsageFill: {
    height: 20,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    marginBottom: 5,
  },
  dataUsageLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dataUsageStats: {
    marginTop: 10,
  },
  dataUsageStat: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 3,
  },
  // Feed styles
  feedHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  feedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  feedSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  feedList: {
    flex: 1,
    padding: 20,
  },
  feedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedIcon: {
    marginRight: 15,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  feedLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 12,
    color: '#999',
  },
  feedDiseaseInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  feedDiseaseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  feedDiseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 3,
  },
  feedConfidence: {
    fontSize: 14,
    color: '#666',
  },
  // Help button
  helpButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 24,
  },
  treatmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  subSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Account screen styles
  welcomeAccountCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  welcomeEmail: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  assistanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assistanceContent: {
    flex: 1,
    marginLeft: 15,
  },
  assistanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  assistanceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  // Activity Cards
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#666',
  },
  sellerCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    elevation: 3,
    alignItems: 'center',
  },
  sellerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  sellerDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  sellerButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  sellerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contactInfo: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  assistanceItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  assistanceItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  // Smart Farming Styles
  smartFarmingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  smartFeatureButton: {
    backgroundColor: '#2196F3',
    width: (width - 60) / 2,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  smartFeatureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  // Disabled functionality styles
  disabledSection: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Consult content styles
  consultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  consultMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Bot image styles - positioned near the tabs
  botImageContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  botImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes it perfectly circular
    borderWidth: 3,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Chatbot modal styles
  chatbotModal: {
    flex: 1,
    backgroundColor: '#2c5530', // Solid green background (instant, no delay!)
  },
  chatbotBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  chatbotBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3, // Make it subtle so it doesn't delay visibility
  },
  chatbotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay since background is darker now
  },
  chatbotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 85, 48, 0.9)', // Semi-transparent dark green
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatbotTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button
  },
  
  // Authentication styles
  authStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authStatusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  authStatusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  logoutButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Profile editing styles
  welcomePhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
  },
  profilePhotoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  welcomeUsername: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  editProfileButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 5,
  },
  editProfileSection: {
    width: '100%',
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
    marginTop: 10,
  },
  editInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  editHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Phone verification modal styles
  verificationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  verificationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginTop: 15,
    marginBottom: 10,
  },
  verificationModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  verificationCodeInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  verificationModalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  verificationCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  verificationCancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  verificationSubmitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  verificationSubmitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

const insightsStyles = StyleSheet.create({
  insightsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  severity: {
    fontSize: 14,
    color: '#666',
  },
  detailedInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginTop: 10,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  // Diagnose styles removed
  blogScroll: {
    marginTop: 10,
  },
  blogCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    width: 150,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  blogIcon: {
    textAlign: 'center',
    marginBottom: 8,
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  blogDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  nextSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#FF5722',
    marginTop: 10,
  },
  // Tab styles
  tabHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tabTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeSubTab: {
    backgroundColor: '#4CAF50',
  },
  subTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  subTabIcon: {
    marginRight: 5,
  },
  activeSubTabText: {
    color: 'white',
  },
  // Feature cards
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    textAlign: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  featureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Activity and graph styles
  activityCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  graphCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  graphBar: {
    marginBottom: 15,
  },
  graphBarFill: {
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginBottom: 5,
  },
  graphLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Crop grid styles
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  cropItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
    borderRadius: 25,
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 4,
    textAlign: 'center',
  },
  cropCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  savedIcon: {
    marginRight: 15,
  },
  savedContent: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  savedDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Settings styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataUsageCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataUsageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataUsageBar: {
    marginBottom: 15,
  },
  dataUsageFill: {
    height: 20,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    marginBottom: 5,
  },
  dataUsageLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dataUsageStats: {
    marginTop: 10,
  },
  dataUsageStat: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 3,
  },
  // Feed styles
  feedHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  feedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  feedSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  feedList: {
    flex: 1,
    padding: 20,
  },
  feedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedIcon: {
    marginRight: 15,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  feedLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 12,
    color: '#999',
  },
  feedDiseaseInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  feedDiseaseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  feedDiseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 3,
  },
  feedConfidence: {
    fontSize: 14,
    color: '#666',
  },
  // Help button
  helpButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 24,
  },
  treatmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  subSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Account screen styles
  welcomeAccountCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  welcomeEmail: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  assistanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assistanceContent: {
    flex: 1,
    marginLeft: 15,
  },
  assistanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  assistanceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  // Smart Farming Styles
  smartFarmingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  smartFeatureButton: {
    backgroundColor: '#2196F3',
    width: (width - 60) / 2,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  smartFeatureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  // Disabled functionality styles
  disabledSection: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Consult content styles
  consultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  consultMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Bot image styles - positioned near the tabs
  botImageContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  botImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes it perfectly circular
    borderWidth: 3,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Chatbot modal styles
  chatbotModal: {
    flex: 1,
    backgroundColor: '#2c5530', // Solid green background (instant, no delay!)
  },
  chatbotBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  chatbotBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3, // Make it subtle so it doesn't delay visibility
  },
  chatbotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay since background is darker now
  },
  chatbotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 85, 48, 0.9)', // Semi-transparent dark green
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatbotTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button
  },
  
  // Authentication styles
  authStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authStatusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  authStatusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  logoutButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

const budgetStyles = StyleSheet.create({
  budgetItemCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    flex: 1,
  },
  budgetItemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  budgetItemDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  budgetItemDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  productSuggestionsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  suggestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'white',
  },
  suggestionsToggleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  suggestionsToggleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  suggestionsToggleTextActive: {
    color: 'white',
  },
  productSuggestionsContainer: {
    maxHeight: 300,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  productList: {
    maxHeight: 200,
    padding: 8,
  },
  productSuggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  productSuggestionContent: {
    flex: 1,
  },
  productSuggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSuggestionCategory: {
    fontSize: 13,
    color: '#666',
  },
  productSuggestionPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productSuggestionPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 8,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
  },
  recommendationDetails: {
    marginLeft: 32,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  budgetSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  budgetCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  budgetBreakdown: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  budgetBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  budgetItemCrop: {
    fontSize: 14,
    color: '#333',
  },
  budgetItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
  },
  modalBody: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },


  disabledButton: {
    backgroundColor: '#ccc',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  screenSubtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryList: {
    flex: 1,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCategory: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },

  manualContainer: {
    flex: 1,
    marginBottom: 20,
  },
  manualStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Background video styles - REMOVED
  screenContent: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 15,
  },

  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  // Identify and camera button styles removed
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  
  // Enhanced Result Styles
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cropInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 10,
    textAlign: 'center',
  },
  confidenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  analysisMethod: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  healthIndicator: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  healthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  diseaseInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  severityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  severityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  economicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  economicItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  economicLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  economicValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  postHarvestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  postHarvestItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  postHarvestLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  postHarvestValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  treatmentsList: {
    marginBottom: 15,
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  treatmentNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  treatmentNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  businessList: {
    marginBottom: 15,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 6,
  },
  businessText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  insightsList: {
    marginBottom: 15,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 6,
  },
  insightsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  severity: {
    fontSize: 14,
    color: '#666',
  },
  detailedInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginTop: 10,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  // Diagnose styles removed
  blogScroll: {
    marginTop: 10,
  },
  blogCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    width: 150,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  blogIcon: {
    textAlign: 'center',
    marginBottom: 8,
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  blogDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  nextSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#FF5722',
    marginTop: 10,
  },
  // Tab styles
  tabHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tabTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeSubTab: {
    backgroundColor: '#4CAF50',
  },
  subTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  subTabIcon: {
    marginRight: 5,
  },
  activeSubTabText: {
    color: 'white',
  },
  // Feature cards
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    textAlign: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  featureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Activity and graph styles
  activityCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  graphCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  graphBar: {
    marginBottom: 15,
  },
  graphBarFill: {
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginBottom: 5,
  },
  graphLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Crop grid styles
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  cropItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
    borderRadius: 25,
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 4,
    textAlign: 'center',
  },
  cropCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  savedIcon: {
    marginRight: 15,
  },
  savedContent: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  savedDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Settings styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataUsageCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataUsageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataUsageBar: {
    marginBottom: 15,
  },
  dataUsageFill: {
    height: 20,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    marginBottom: 5,
  },
  dataUsageLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dataUsageStats: {
    marginTop: 10,
  },
  dataUsageStat: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 3,
  },
  // Feed styles
  feedHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  feedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  feedSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  feedList: {
    flex: 1,
    padding: 20,
  },
  feedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedIcon: {
    marginRight: 15,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  feedLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 12,
    color: '#999',
  },
  feedDiseaseInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  feedDiseaseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  feedDiseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 3,
  },
  feedConfidence: {
    fontSize: 14,
    color: '#666',
  },
  // Help button
  helpButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 24,
  },
  treatmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  subSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Account screen styles
  welcomeAccountCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  welcomeEmail: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  assistanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assistanceContent: {
    flex: 1,
    marginLeft: 15,
  },
  assistanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  assistanceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  // Activity Cards
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#666',
  },
  sellerCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    elevation: 3,
    alignItems: 'center',
  },
  sellerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  sellerDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  sellerButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  sellerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contactInfo: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  assistanceItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  assistanceItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  // Smart Farming Styles
  smartFarmingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  smartFeatureButton: {
    backgroundColor: '#2196F3',
    width: (width - 60) / 2,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  smartFeatureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  // Disabled functionality styles
  disabledSection: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Consult content styles
  consultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  consultMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Bot image styles - positioned near the tabs
  botImageContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  botImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes it perfectly circular
    borderWidth: 3,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Chatbot modal styles
  chatbotModal: {
    flex: 1,
    backgroundColor: '#2c5530', // Solid green background (instant, no delay!)
  },
  chatbotBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  chatbotBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3, // Make it subtle so it doesn't delay visibility
  },
  chatbotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay since background is darker now
  },
  chatbotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 85, 48, 0.9)', // Semi-transparent dark green
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatbotTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button
  },
  
  // Authentication styles
  authStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authStatusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  authStatusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  logoutButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Profile editing styles
  welcomePhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
  },
  profilePhotoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  welcomeUsername: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  editProfileButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 5,
  },
  editProfileSection: {
    width: '100%',
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
    marginTop: 10,
  },
  editInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  editHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Phone verification modal styles
  verificationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  verificationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginTop: 15,
    marginBottom: 10,
  },
  verificationModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  verificationCodeInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  verificationModalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  verificationCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  verificationCancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  verificationSubmitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  verificationSubmitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

const insightsStyles2 = StyleSheet.create({
  insightsText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  severity: {
    fontSize: 14,
    color: '#666',
  },
  detailedInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginTop: 10,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  // Diagnose styles removed
  blogScroll: {
    marginTop: 10,
  },
  blogCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    width: 150,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  blogIcon: {
    textAlign: 'center',
    marginBottom: 8,
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  blogDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  nextSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#FF5722',
    marginTop: 10,
  },
  // Tab styles
  tabHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tabTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
  },
  tabIcon: {
    marginBottom: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeSubTab: {
    backgroundColor: '#4CAF50',
  },
  subTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  subTabIcon: {
    marginRight: 5,
  },
  activeSubTabText: {
    color: 'white',
  },
  // Feature cards
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    textAlign: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  featureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Activity and graph styles
  activityCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  graphCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  graphBar: {
    marginBottom: 15,
  },
  graphBarFill: {
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginBottom: 5,
  },
  graphLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Crop grid styles
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  cropItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
    borderRadius: 25,
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 4,
    textAlign: 'center',
  },
  cropCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  savedIcon: {
    marginRight: 15,
  },
  savedContent: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  savedDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Settings styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataUsageCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataUsageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataUsageBar: {
    marginBottom: 15,
  },
  dataUsageFill: {
    height: 20,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    marginBottom: 5,
  },
  dataUsageLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dataUsageStats: {
    marginTop: 10,
  },
  dataUsageStat: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 3,
  },
  // Feed styles
  feedHeader: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2c5530',
  },
  feedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  feedSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  feedList: {
    flex: 1,
    padding: 20,
  },
  feedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedIcon: {
    marginRight: 15,
  },
  feedUserInfo: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  feedLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 12,
    color: '#999',
  },
  feedDiseaseInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  feedDiseaseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  feedDiseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 3,
  },
  feedConfidence: {
    fontSize: 14,
    color: '#666',
  },
  // Help button
  helpButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 24,
  },
  treatmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  subSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Account screen styles
  welcomeAccountCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
  },
  welcomeEmail: {
    fontSize: 14,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  assistanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assistanceContent: {
    flex: 1,
    marginLeft: 15,
  },
  assistanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 3,
  },
  assistanceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  // Smart Farming Styles
  smartFarmingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  smartFeatureButton: {
    backgroundColor: '#2196F3',
    width: (width - 60) / 2,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  smartFeatureText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  // Disabled functionality styles
  disabledSection: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Consult content styles
  consultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  consultMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Bot image styles - positioned near the tabs
  botImageContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  botImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Makes it perfectly circular
    borderWidth: 3,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Chatbot modal styles
  chatbotModal: {
    flex: 1,
    backgroundColor: '#2c5530', // Solid green background (instant, no delay!)
  },
  chatbotBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  chatbotBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.3, // Make it subtle so it doesn't delay visibility
  },
  chatbotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay since background is darker now
  },
  chatbotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 85, 48, 0.9)', // Semi-transparent dark green
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatbotTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button
  },
  
  // Authentication styles
  authStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authStatusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  authStatusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  logoutButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});



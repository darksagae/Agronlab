import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import lg from './locales/lg.json';
import rn from './locales/rn.json';
import sw from './locales/sw.json';

// Language resources
const resources = {
  en: { translation: en },
  lg: { translation: lg },
  rn: { translation: rn },
  sw: { translation: sw }
};

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English' },
  'lg': { name: 'Luganda', nativeName: 'Luganda' },
  'rn': { name: 'Runyankole', nativeName: 'Runyankole' },
  'sw': { name: 'Kiswahili', nativeName: 'Kiswahili' }
};

// Get device language
const getDeviceLanguage = () => {
  try {
    const deviceLocale = Localization.locale;
    console.log('Device locale:', deviceLocale);
    
    if (!deviceLocale) {
      console.log('No device locale found, defaulting to English');
      return 'en';
    }
    
    const languageCode = deviceLocale.split('-')[0];
    console.log('Extracted language code:', languageCode);
    
    // Check if device language is supported
    if (SUPPORTED_LANGUAGES[languageCode]) {
      console.log('Device language is supported:', languageCode);
      return languageCode;
    }
    
    console.log('Device language not supported, defaulting to English');
    return 'en';
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en';
  }
};

// Get saved language from storage
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    console.log('Saved language from storage:', savedLanguage);
    
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      console.log('Using saved language:', savedLanguage);
      return savedLanguage;
    }
    
    console.log('No valid saved language, using device language');
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error getting saved language:', error);
    console.log('Falling back to device language');
    return getDeviceLanguage();
  }
};

// Safe useTranslation hook
export const useSafeTranslation = () => {
  const { t, i18n } = useTranslation();
  
  const safeT = (key, options = {}) => {
    try {
      if (t && typeof t === 'function') {
        return t(key, options);
      }
      return key; // Fallback to key if t is not available
    } catch (error) {
      console.warn('Translation error:', error);
      return key;
    }
  };
  
  return { t: safeT, i18n };
};

// Global fallback for t function
const globalT = (key) => {
  try {
    if (i18n && i18n.t) {
      return i18n.t(key);
    }
    return key;
  } catch (error) {
    console.warn('Global translation error:', error);
    return key;
  }
};

// Emergency global fallback for t function
window.t = window.t || ((key) => key);
global.t = global.t || ((key) => key);

// Initialize i18n
const initI18n = async () => {
  try {
    const savedLanguage = await getSavedLanguage();
    console.log('Initializing i18n with language:', savedLanguage);
    
    await i18n
      .use(initReactI18next)
      .init({
        lng: savedLanguage,
        fallbackLng: 'en',
        resources,
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        },
        debug: false,
        keySeparator: '.',
        nsSeparator: false,
        // Simplified configuration to avoid plural resolver errors
        returnObjects: false,
        returnNull: false,
        returnEmptyString: false,
        // Disable complex pluralization
        pluralSeparator: false,
        contextSeparator: false,
        // Add compatibility options
        compatibilityJSON: 'v3'
      });
    
    // Add global error handler for missing translations
    i18n.on('missingKey', (lng, ns, key) => {
      console.warn(`Missing translation for key: ${key} in language: ${lng}`);
      return key; // Return the key as fallback
    });
    
    // Ensure t function is always available
    if (!i18n.t) {
      i18n.t = globalT; // Use global fallback function
    }
    
    // Add global error handler for any remaining t function errors
    const originalT = i18n.t;
    i18n.t = (key, options) => {
      try {
        return originalT(key, options);
      } catch (error) {
        console.warn('Translation error caught:', error);
        return key;
      }
    };
    
    // Set global t function as emergency fallback
    if (typeof window !== 'undefined') {
      window.t = i18n.t;
    }
    if (typeof global !== 'undefined') {
      global.t = i18n.t;
    }
    
    console.log('i18n initialized successfully with language:', savedLanguage);
    console.log('Available languages:', Object.keys(resources));
    console.log('Current i18n language:', i18n.language);
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

// Language switching function
export const changeLanguage = async (languageCode) => {
  try {
    console.log(`Attempting to change language to: ${languageCode}`);
    
    // Check if the language is supported
    if (!resources[languageCode]) {
      throw new Error(`Language ${languageCode} is not supported`);
    }
    
    // Save to storage first
    await AsyncStorage.setItem('selectedLanguage', languageCode);
    
    // Change the language
    await i18n.changeLanguage(languageCode);
    
    console.log(`Language successfully changed to: ${languageCode}`);
    console.log(`Current i18n language: ${i18n.language}`);
    
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Get language name
export const getLanguageName = (code) => {
  return SUPPORTED_LANGUAGES[code]?.nativeName || 'English';
};

// Initialize i18n
initI18n();

// Export the i18n instance
export default i18n;

// Also export a function to change language that works
export const switchLanguage = async (languageCode) => {
  try {
    console.log(`Switching language to: ${languageCode}`);
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem('selectedLanguage', languageCode);
    
    // Emit language change event to trigger re-renders
    if (i18n.emit) {
      i18n.emit('languageChanged', languageCode);
    }
    
    console.log(`Language switched successfully to: ${languageCode}`);
    return true;
  } catch (error) {
    console.error('Error in switchLanguage:', error);
    return false;
  }
};



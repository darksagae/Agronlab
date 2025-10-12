import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeTranslation } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher = ({ style, showLabel = true }) => {
  const { t, i18n } = useSafeTranslation();
  const { changeLanguage: changeLanguageContext } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const SUPPORTED_LANGUAGES = {
    'en': { nativeName: 'English', flag: '🇺🇸' },
    'lg': { nativeName: 'Luganda', flag: '🇺🇬' },
    'rn': { nativeName: 'Runyankole', flag: '🇺🇬' },
    'sw': { nativeName: 'Kiswahili', flag: '🇹🇿' }
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      console.log(`Switching to language: ${languageCode}`);
      
      // Save to storage first
      await AsyncStorage.setItem('selectedLanguage', languageCode);
      
      // Use the language context to change language
      await changeLanguageContext(languageCode);
      
      // Update local state immediately
      setCurrentLanguage(languageCode);
      setShowModal(false);
      
      console.log(`Language switched to: ${languageCode}`);
      console.log(`Current i18n language: ${i18n.language}`);
      
      // Show success message
      Alert.alert(
        'Language Changed',
        `Language has been changed to ${getLanguageName(languageCode)}.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error switching language:', error);
      
      // Fallback: just save the preference and show alert
      try {
        await AsyncStorage.setItem('selectedLanguage', languageCode);
        Alert.alert(
          'Language Changed',
          'Language preference saved. Please restart the app to see the change.',
          [{ text: 'OK' }]
        );
        setCurrentLanguage(languageCode);
        setShowModal(false);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const getLanguageName = (code) => {
    return SUPPORTED_LANGUAGES[code]?.nativeName || 'English';
  };

  // Update current language when i18n language changes
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const renderLanguageItem = ({ item }) => {
    const [code, info] = item;
    const isSelected = code === currentLanguage;
    
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageChange(code)}
      >
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isSelected && styles.selectedLanguageName]}>
            {info.nativeName}
          </Text>
          <Text style={[styles.languageCode, isSelected && styles.selectedLanguageCode]}>
            {code.toUpperCase()}
          </Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check" size={20} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setShowModal(true)}
      >
        <MaterialIcons name="language" size={20} color="#4CAF50" />
        {showLabel && (
          <Text style={styles.languageButtonText}>
            {getLanguageName(currentLanguage)}
          </Text>
        )}
        <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.selectLanguage')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(SUPPORTED_LANGUAGES)}
              keyExtractor={([code]) => code}
              renderItem={renderLanguageItem}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageButtonText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguageItem: {
    backgroundColor: '#E8F5E8',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedLanguageName: {
    color: '#2c5530',
    fontWeight: 'bold',
  },
  languageCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedLanguageCode: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default LanguageSwitcher;

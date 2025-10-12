import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSafeTranslation } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useSafeTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language changed in context:', i18n.language);
      setCurrentLanguage(i18n.language);
      setForceUpdate(prev => prev + 1);
    };

    // Listen for language changes
    if (i18n && i18n.on) {
      i18n.on('languageChanged', handleLanguageChange);
    }

    // Also check periodically
    const interval = setInterval(() => {
      if (i18n.language !== currentLanguage) {
        handleLanguageChange();
      }
    }, 500);

    return () => {
      if (i18n && i18n.off) {
        i18n.off('languageChanged', handleLanguageChange);
      }
      clearInterval(interval);
    };
  }, [i18n, currentLanguage]);

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setForceUpdate(prev => prev + 1);
      console.log('Language changed successfully:', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      forceUpdate
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


import AsyncStorage from '@react-native-async-storage/async-storage';

class ProductTranslationService {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'en';
    this.loadTranslations();
  }

  // Load translations for all supported languages
  async loadTranslations() {
    try {
      const languages = ['en', 'lg', 'rn', 'sw'];
      
      for (const lang of languages) {
        try {
          const translationData = await import(`../locales/products_${lang}.json`);
          this.translations[lang] = translationData.default || translationData;
        } catch (error) {
          console.log(`No product translations found for ${lang}, using English fallback`);
          if (lang !== 'en') {
            this.translations[lang] = this.translations['en'] || {};
          }
        }
      }
    } catch (error) {
      console.error('Error loading product translations:', error);
    }
  }

  // Set current language
  setLanguage(language) {
    this.currentLanguage = language;
  }

  // Get translated product content
  getTranslatedProduct(product, language = this.currentLanguage) {
    if (!product || !product.name) return product;

    const productKey = this.getProductKey(product.name);
    const translations = this.translations[language] || this.translations['en'] || {};
    const productTranslations = translations[productKey] || {};

    // Return translated product with fallback to original
    return {
      ...product,
      name: productTranslations.name || product.name,
      description: productTranslations.description || product.description,
      specifications: productTranslations.specifications || product.specifications,
      features: productTranslations.features || product.features,
      usage_instructions: productTranslations.usage_instructions || product.usage_instructions,
      application_method: productTranslations.application_method || product.application_method,
      benefits: productTranslations.benefits || product.benefits,
      storage_instructions: productTranslations.storage_instructions || product.storage_instructions,
      safety_info: productTranslations.safety_info || product.safety_info,
      price: productTranslations.price || product.price,
      // Add translated sections
      overview: productTranslations.overview || product.overview,
      key_features: productTranslations.key_features || product.key_features,
      growing_requirements: productTranslations.growing_requirements || product.growing_requirements,
      planting_instructions: productTranslations.planting_instructions || product.planting_instructions,
      harvesting: productTranslations.harvesting || product.harvesting,
      disease_resistance: productTranslations.disease_resistance || product.disease_resistance,
      yield_potential: productTranslations.yield_potential || product.yield_potential,
      maturity: productTranslations.maturity || product.maturity,
      spacing: productTranslations.spacing || product.spacing,
      seed_rate: productTranslations.seed_rate || product.seed_rate
    };
  }

  // Generate product key from product name
  getProductKey(productName) {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  }

  // Get translated category name
  getTranslatedCategoryName(categoryName, language = this.currentLanguage) {
    const translations = this.translations[language] || this.translations['en'] || {};
    const categoryTranslations = translations.categories || {};
    
    return categoryTranslations[categoryName] || categoryName;
  }

  // Get translated section headers
  getTranslatedSectionHeaders(language = this.currentLanguage) {
    const translations = this.translations[language] || this.translations['en'] || {};
    return translations.section_headers || {
      overview: 'Overview',
      specifications: 'Specifications',
      features: 'Key Features',
      usage_instructions: 'Usage Instructions',
      application_method: 'Application Method',
      benefits: 'Benefits',
      storage_instructions: 'Storage Instructions',
      safety_info: 'Safety Information',
      price: 'Price Information',
      growing_requirements: 'Growing Requirements',
      planting_instructions: 'Planting Instructions',
      harvesting: 'Harvesting',
      disease_resistance: 'Disease Resistance',
      yield_potential: 'Yield Potential',
      maturity: 'Maturity',
      spacing: 'Spacing',
      seed_rate: 'Seed Rate'
    };
  }

  // Get all available languages
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  // Check if translations exist for a language
  hasTranslations(language) {
    return this.translations[language] && Object.keys(this.translations[language]).length > 0;
  }
}

export default new ProductTranslationService();

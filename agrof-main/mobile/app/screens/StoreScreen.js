import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, TextInput, FlatList, Animated, Easing, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeTranslation } from '../i18n';
import { categoriesApi, productsApi, healthCheck } from '../services/storeApi';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import storeImageService from '../services/storeImageService';
import OptimizedImage from '../components/OptimizedImage';
import CategoryProductsScreen from './CategoryProductsScreen';
import CartScreen from './CartScreen';
import ProductDetailScreen from './ProductDetailScreen';
import { featuredProducts } from '../data/featuredProducts';
import StoreIconGrid from '../components/StoreIconGrid';
import storeRegistryService, { normaliseStoreProduct } from '../services/storeRegistryService';

const StoreScreen = () => {
  const { t } = useSafeTranslation();
  const { currentLanguage, forceUpdate } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [categories, setCategories] = useState([]);
  const [apiFeaturedProducts, setApiFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [backendStatus, setBackendStatus] = useState('checking');

  // Multi-store: null = landing, 'agron' = AGRON global, storeId = company store
  const [selectedStore, setSelectedStore] = useState(null);
  const [registeredStores, setRegisteredStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [companyProducts, setCompanyProducts] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [allStoreProducts, setAllStoreProducts] = useState([]);
  
  // Marquee animation
  const marqueeAnimation = useRef(new Animated.Value(0)).current;

  const { getTotalItems } = useCart();

  // Function to get real product images from store folder
  const getProductImage = (product) => {
    return storeImageService.getProductImage(product);
  };

  // Legacy function for backward compatibility
  const getCategoryImage = (categoryName) => {
    return storeImageService.getCategoryImage(categoryName);
  };

  // Fallback categories if API fails
  const fallbackCategories = useMemo(() => [
    { id: 1, name: 'fertilizers', display_name: 'Fertilizers', image: require('../assets/fertilizers.png') },
    { id: 2, name: 'fungicides', display_name: 'Fungicides', image: require('../assets/fungicides.png') },
    { id: 3, name: 'herbicides', display_name: 'Herbicides', image: require('../assets/herbicides.png') },
    { id: 4, name: 'nursery_bed', display_name: 'Nursery Bed', image: require('../assets/nurserybed.png') },
    { id: 5, name: 'organic_chemicals', display_name: 'Organic Chemicals', image: require('../assets/organic_chemicals.png') },
    { id: 6, name: 'seeds', display_name: 'Seeds', image: require('../assets/seeds.png') },
  ], []);

  // Featured products from API with fallback to static data, merged with AppSync store products
  const extendedFeaturedProducts = useMemo(() => {
    const base = apiFeaturedProducts.length > 0 ? apiFeaturedProducts : featuredProducts;
    const extra = allStoreProducts.map(normaliseStoreProduct);
    return [...base, ...extra];
  }, [apiFeaturedProducts, allStoreProducts]);

  // Load registered stores for the landing icon grid
  useEffect(() => {
    storeRegistryService.fetchRegisteredStores()
      .then(data => setRegisteredStores(data))
      .finally(() => setStoresLoading(false));
  }, []);

  // When AGRON store is selected, also load all AppSync store products to merge
  useEffect(() => {
    if (selectedStore === 'agron') {
      storeRegistryService.fetchAllStoreProducts()
        .then(data => setAllStoreProducts(data));
    }
  }, [selectedStore]);

  // When a company store is selected, load its products
  useEffect(() => {
    if (selectedStore && selectedStore !== 'agron') {
      setCompanyLoading(true);
      storeRegistryService.fetchStoreProducts(selectedStore)
        .then(data => setCompanyProducts(data))
        .finally(() => setCompanyLoading(false));
    }
  }, [selectedStore]);

  // Load categories and featured products on mount
  useEffect(() => {
    loadStoreData();
  }, []);

  // Retry loading if featured products fail
  useEffect(() => {
    if (apiFeaturedProducts.length === 0 && !loading) {
      console.log('🔄 Retrying featured products loading...');
      const retryTimer = setTimeout(() => {
        loadStoreData();
      }, 2000);
      return () => clearTimeout(retryTimer);
    }
  }, [apiFeaturedProducts.length, loading]);

  // Preload images when products are loaded
  useEffect(() => {
    if (apiFeaturedProducts.length > 0) {
      storeImageService.preloadImages(apiFeaturedProducts);
    }
  }, [apiFeaturedProducts]);

  // Preload category images for faster loading
  useEffect(() => {
    if (categories.length > 0) {
      const categoryProducts = categories.map(cat => ({ 
        id: cat.id, 
        name: cat.name, 
        category_name: cat.name 
      }));
      storeImageService.preloadImages(categoryProducts);
    }
  }, [categories]);

  // Start marquee animation - never stops
  useEffect(() => {
    if (extendedFeaturedProducts.length === 0) return;
    
    const startMarquee = () => {
      marqueeAnimation.setValue(0);
      
      const animate = () => {
        Animated.timing(marqueeAnimation, {
          toValue: 1,
          duration: 20000, // 20 seconds for faster movement
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(() => {
          marqueeAnimation.setValue(0);
          animate(); // Restart immediately
        });
      };
      
      animate();
    };

    const timer = setTimeout(startMarquee, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [extendedFeaturedProducts.length]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading store data...');
      
      // Load categories and products in parallel (streamlined for speed)
      const [health, categoriesData, productsData] = await Promise.allSettled([
        healthCheck().catch(err => {
          console.warn('⚠️ Health check error:', err);
          return { status: 'ERROR', message: err.message };
        }),
        categoriesApi.getAll(currentLanguage).catch(err => {
          console.warn('⚠️ Categories API error:', err);
          return [];
        }),
        productsApi.getAll({ limit: 6, language: currentLanguage }).catch(err => {
          console.warn('⚠️ Products API error:', err);
          return [];
        })
      ]);
      
      // Handle health check result
      if (health.status === 'fulfilled' && health.value) {
        console.log('🏥 Health check result:', health.value);
        setBackendStatus(health.value.status === 'OK' ? 'connected' : 'disconnected');
      } else {
        console.warn('⚠️ Health check failed, using fallback');
        setBackendStatus('disconnected');
      }
      
      // Handle categories result
      if (categoriesData.status === 'fulfilled' && categoriesData.value) {
        console.log('📂 Categories loaded:', categoriesData.value.length, 'categories');
        setCategories(categoriesData.value.length > 0 ? categoriesData.value : fallbackCategories);
      } else {
        console.warn('⚠️ Categories loading failed, using fallback');
        setCategories(fallbackCategories);
      }
      
      // Handle products result
      if (productsData.status === 'fulfilled' && productsData.value) {
        console.log('⭐ Featured products loaded:', productsData.value.length, 'products');
        console.log('⭐ Featured products data:', productsData.value);
        setApiFeaturedProducts(productsData.value);
      } else {
        console.warn('⚠️ Products loading failed, using fallback');
        console.warn('⚠️ Products error details:', productsData.reason);
        setApiFeaturedProducts([]);
      }
      
    } catch (error) {
      console.error('❌ Critical error in loadStoreData:', error);
      setBackendStatus('disconnected');
      
      // Use fallback data immediately for faster display
      setCategories(fallbackCategories);
      setApiFeaturedProducts([]);
      
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (query) => {
    // Don't search if query is empty or too short
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await productsApi.search(query.trim());
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const handleCategoryPress = useCallback((category) => {
    console.log(`🏪 Store: Loading ${category.name} category...`);
    setSelectedCategory(category);
  }, []);

  // Optimized image loading handler
  const handleImageLoad = (categoryId) => {
    setImageLoadingStates(prev => ({ ...prev, [categoryId]: false }));
  };

  const handleImageLoadStart = (categoryId) => {
    setImageLoadingStates(prev => ({ ...prev, [categoryId]: true }));
  };

  // Duplicate getCategoryImage function removed - using the one declared earlier

  // Store landing: show icon grid when no store is selected
  if (selectedStore === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="store" size={32} color="white" />
            <Text style={styles.headerTitle}>{t('store.title')}</Text>
            <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
              <MaterialIcons name="shopping-cart" size={24} color="white" />
              {getTotalItems() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Choose a store to browse</Text>
        </View>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <StoreIconGrid
            stores={registeredStores}
            loading={storesLoading}
            onSelect={store => setSelectedStore(store.id === 'agron' ? 'agron' : store.id)}
          />
        </ScrollView>
      </View>
    );
  }

  // Company store view — shows only that store's AppSync products
  if (selectedStore !== 'agron') {
    const storeInfo = registeredStores.find(s => s.id === selectedStore);
    const storeName = storeInfo?.name ?? 'Store';
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity onPress={() => setSelectedStore(null)}>
              <MaterialIcons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { marginLeft: 10 }]}>{storeName}</Text>
            <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
              <MaterialIcons name="shopping-cart" size={24} color="white" />
              {getTotalItems() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {storeInfo?.tagline ? (
            <Text style={styles.headerSubtitle}>{storeInfo.tagline}</Text>
          ) : null}
        </View>
        {companyLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : companyProducts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="inventory" size={48} color="#ccc" />
            <Text style={[styles.loadingText, { marginTop: 12 }]}>No products listed yet</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.companyProductsGrid}>
              {companyProducts.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.companyProductCard}
                  onPress={() => setSelectedProduct(normaliseStoreProduct(p))}
                >
                  <View style={styles.companyProductImage}>
                    <MaterialIcons name="eco" size={36} color="#4CAF50" />
                  </View>
                  <Text style={styles.companyProductName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.companyProductPrice}>
                    {p.priceLabel ?? (p.sellingPrice != null ? `UGX ${p.sellingPrice.toLocaleString()}` : '—')}
                  </Text>
                  {p.inStock === false && (
                    <Text style={styles.outOfStock}>Out of stock</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  // Show product detail screen if a product is selected
  if (selectedProduct) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ProductDetailScreen 
          route={{ params: { productId: selectedProduct.id, product: selectedProduct } }}
          navigation={{ goBack: () => setSelectedProduct(null) }}
        />
      </Modal>
    );
  }

  // Show category products screen if a category is selected
  if (selectedCategory) {
    return (
      <CategoryProductsScreen 
        categoryName={selectedCategory.name}
        categoryDisplayName={selectedCategory.display_name}
        onBack={() => setSelectedCategory(null)} 
      />
    );
  }

  if (showCart) {
    return (
      <CartScreen 
        onBack={() => setShowCart(false)} 
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="store" size={32} color="white" />
            <Text style={styles.headerTitle}>{t('store.title')}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View key={`store-${currentLanguage}-${forceUpdate}`} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity onPress={() => setSelectedStore(null)} style={{ marginRight: 6 }}>
            <MaterialIcons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <MaterialIcons name="store" size={28} color="white" />
          <Text style={styles.headerTitle}>{t('store.title')}</Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setShowCart(true)}
          >
            <MaterialIcons name="shopping-cart" size={24} color="white" />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{t('store.subtitle')}</Text>
        
        {/* Backend Status */}
        <View style={styles.statusContainer}>
          <MaterialIcons 
            name={backendStatus === 'connected' ? 'wifi' : 'wifi-off'} 
            size={16} 
            color={backendStatus === 'connected' ? '#4CAF50' : '#FF5722'} 
          />
          <Text style={[styles.statusText, { color: backendStatus === 'connected' ? '#4CAF50' : '#FF5722' }]}>
            {backendStatus === 'connected' ? 'Online' : 'Offline Mode'}
          </Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('store.search')}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Only search when user presses enter, not on every keystroke
            }}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setShowSearchResults(false);
            }}>
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

      {/* Search Results */}
      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>
            Search Results ({searchResults.length})
          </Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => setSelectedProduct(item)}
              >
                <OptimizedImage 
                  product={item}
                  style={styles.searchResultImage}
                  resizeMode="cover"
                />
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultCategory}>{item.category_display_name}</Text>
                  <Text style={styles.searchResultPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        </View>
      )}

      {/* Featured Products Marquee */}
      {!showSearchResults && (
        <View style={styles.featuredContainer}>
          <Text style={styles.featuredTitle}>{t('store.featured')}</Text>
          {extendedFeaturedProducts.length > 0 ? (
            <View style={styles.marqueeContainer}>
            <Animated.View 
              style={[
                styles.marqueeContent,
                {
                  transform: [{
                    translateX: marqueeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(extendedFeaturedProducts.length * 165)] // Move left by total width
                    })
                  }]
                }
              ]}
            >
              {/* First set of products */}
              {extendedFeaturedProducts.map((product, index) => {
                console.log('🎯 Marquee product:', { 
                  id: product.id, 
                  name: product.name, 
                  price: product.price,
                  index 
                });
                return (
                  <TouchableOpacity 
                    key={product.id} 
                    style={styles.featuredItem}
                    onPress={() => setSelectedProduct(product)}
                  >
                    <Image 
                      source={getProductImage(product)} 
                      style={styles.featuredImage} 
                      defaultSource={require('../assets/fertilizers.png')}
                    />
                    <Text style={styles.featuredName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.featuredPrice}>{product.price}</Text>
                  </TouchableOpacity>
                );
              })}
              {/* Duplicate set for seamless loop */}
              {extendedFeaturedProducts.map((product) => (
                <TouchableOpacity 
                  key={`duplicate-${product.id}`} 
                  style={styles.featuredItem}
                  onPress={() => setSelectedProduct(product)}
                >
                  <Image 
                    source={getProductImage(product)} 
                    style={styles.featuredImage} 
                    defaultSource={require('../assets/fertilizers.png')}
                  />
                  <Text style={styles.featuredName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.featuredPrice}>{product.price}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
          ) : (
            <View style={styles.marqueeContainer}>
              <Text style={styles.noProductsText}>
                {loading ? t('common.loading') : 'Featured products loading...'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Category Grid */}
      {!showSearchResults && (
      <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>{t('store.categories')}</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => {
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <OptimizedImage 
                  product={{ category_name: category.name, id: category.id }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <Text style={styles.categoryText}>
                  {category.display_name || category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2c5530',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  searchResultContent: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  featuredContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    margin: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  featuredScroll: {
    paddingLeft: 15,
  },
  marqueeContainer: {
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    position: 'relative',
    marginHorizontal: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  marqueeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  featuredItem: {
    width: 150,
    marginRight: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featuredImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  categoriesContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
    borderRadius: 60,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    textAlign: 'center',
    lineHeight: 16,
  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 80,
  },
  companyProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  companyProductCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  companyProductImage: {
    height: 80,
    backgroundColor: '#f0f7f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 4,
  },
  companyProductPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  outOfStock: {
    fontSize: 11,
    color: '#e53935',
    marginTop: 2,
  },
});

export default StoreScreen;
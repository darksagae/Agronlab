import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, TextInput, FlatList, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { categoriesApi, productsApi, healthCheck } from '../services/storeApi';
import { useCart } from '../contexts/CartContext';
import CategoryProductsScreen from './CategoryProductsScreen';
import CartScreen from './CartScreen';
import ProductDetailScreen from './ProductDetailScreen';
import { featuredProducts } from '../data/featuredProducts';

const StoreScreen = () => {
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
  
  // Debug state changes
  useEffect(() => {
    console.log('🔍 Search results state changed:', showSearchResults);
    console.log('🎯 Featured products should be visible:', !showSearchResults);
  }, [showSearchResults]);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  // Marquee animation
  const marqueeAnimation = useRef(new Animated.Value(0)).current;

  const { getTotalItems } = useCart();


  // Function to get real product images from store folder
  const getProductImage = (product) => {
    // For now, use category images to avoid complex path issues
    // TODO: Implement real product images later
    console.log('🎯 Using category image for product:', product.name, 'category:', product.category);
    return getCategoryImage(product.category);
  };

  // Legacy function for backward compatibility
  const getCategoryImage = (categoryName) => {
    console.log('🖼️ Getting category image for:', categoryName);
    const imageMap = {
      'fertilizers': require('../assets/fertilizers.png'),
      'fungicides': require('../assets/fungicides.png'),
      'herbicides': require('../assets/herbicides.png'),
      'nursery_bed': require('../assets/nurserybed.png'),
      'organic_chemicals': require('../assets/organic_chemicals.png'),
      'seeds': require('../assets/seeds.png'),
      'pesticides': require('../assets/fungicides.png'),
      'tools': require('../assets/fertilizers.png'),
    };
    const image = imageMap[categoryName] || require('../assets/fertilizers.png');
    console.log('🖼️ Category image result:', image ? 'Found' : 'Not found');
    return image;
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

  // Featured products fetched from JavaScript array
  const extendedFeaturedProducts = useMemo(() => {
    console.log('🎯 Featured Products loaded:', featuredProducts.length, 'products');
    console.log('🎯 First few products:', featuredProducts.slice(0, 3));
    console.log('🎯 Sample product with imagePath:', featuredProducts[0]);
    return featuredProducts;
  }, []);

  // Load categories and featured products on mount
  useEffect(() => {
    loadStoreData();
  }, []);

  // Start marquee animation - never stops
  useEffect(() => {
    if (extendedFeaturedProducts.length === 0) return;
    
    console.log('🎬 Starting marquee animation with', extendedFeaturedProducts.length, 'products');
    
    const startMarquee = () => {
      marqueeAnimation.setValue(0);
      
      const animate = () => {
        Animated.timing(marqueeAnimation, {
          toValue: 1,
          duration: 60000, // 60 seconds for slower movement
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
      
      // Check backend health
      console.log('🔍 Checking backend health...');
      const health = await healthCheck();
      console.log('🏥 Health check result:', health);
      setBackendStatus(health.status === 'OK' ? 'connected' : 'disconnected');
      
      // Load categories
      console.log('📂 Loading categories...');
      const categoriesData = await categoriesApi.getAll();
      console.log('📂 Categories loaded:', categoriesData.length, 'categories');
      console.log('📂 Categories data:', categoriesData);
      setCategories(categoriesData.length > 0 ? categoriesData : fallbackCategories);
      
      // Load featured products
      console.log('⭐ Loading featured products...');
      const productsData = await productsApi.getAll({ limit: 6 });
      console.log('⭐ Featured products loaded:', productsData.length, 'products');
      setApiFeaturedProducts(productsData);
      
    } catch (error) {
      console.error('❌ Failed to load store data:', error);
      setBackendStatus('disconnected');
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await productsApi.search(query);
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

  // Show product detail screen if a product is selected
  if (selectedProduct) {
    return (
      <ProductDetailScreen 
        route={{ params: { productId: selectedProduct.id, product: selectedProduct } }}
        navigation={{ goBack: () => setSelectedProduct(null) }}
      />
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
            <Text style={styles.headerTitle}>AGROF Store</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading store...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="store" size={32} color="white" />
          <Text style={styles.headerTitle}>AGROF Store</Text>
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
        <Text style={styles.headerSubtitle}>Quality agricultural products for your farm</Text>
        
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
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
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
                <Image 
                  source={item.image_url ? { uri: `http://192.168.1.15:3001${item.image_url}` } : getCategoryImage(item.category_name)} 
                  style={styles.searchResultImage} 
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
          <Text style={styles.featuredTitle}>Featured Products</Text>
          {console.log('🎬 Rendering marquee with', extendedFeaturedProducts.length, 'products')}
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
                console.log(`🎬 Rendering product ${index + 1}:`, product.name, 'imagePath:', product.imagePath);
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
              <Text style={styles.noProductsText}>Loading featured products...</Text>
            </View>
          )}
        </View>
      )}

      {/* Category Grid */}
      {!showSearchResults && (
      <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {console.log('🏪 Rendering categories:', categories.length, 'categories')}
          {categories.map((category, index) => {
            console.log(`🏪 Category ${index + 1}:`, category.name, 'display_name:', category.display_name);
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <Image 
                  source={getCategoryImage(category.name)} 
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
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginLeft: 15,
    marginBottom: 10,
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
    backgroundColor: 'transparent',
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
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
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 40,
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
});

export default StoreScreen;
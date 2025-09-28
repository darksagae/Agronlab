import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FertilizerDetailScreen from './FertilizerDetailScreen';
import { createProductData, getImageSource, clearProductCache } from '../utils/productDataManager';
import { preloadImages } from '../utils/imageCache';
import { productsApi, clearCache } from '../services/storeApi';

const FertilizerProductsScreen = ({ onBack }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get image source from API data
  const getImageSource = (product) => {
    return product.image_url 
      ? { uri: `http://192.168.1.15:3001${product.image_url}` }
      : require('../assets/fertilizers.png');
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Clear all caches to ensure fresh data
        clearCache();
        clearProductCache();
        const data = await productsApi.getAll({ category: 'fertilizers' });
        setProducts(data);
      } catch (err) {
        console.error('Error fetching fertilizer products:', err);
        setError('Failed to load products');
        Alert.alert('Error', 'Failed to load fertilizer products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Process products with API data
  const fertilizerProducts = useMemo(() => createProductData(products, 'fertilizers'), [products]);

  // Preload images on component mount
  useEffect(() => {
    const imageSources = fertilizerProducts
      .map(product => getImageSource(product))
      .filter(Boolean);
    
    if (imageSources.length > 0) {
      preloadImages(imageSources).catch(console.warn);
    }
  }, [fertilizerProducts]);

  // Render item component with performance optimizations
  const renderProduct = useCallback(({ item }) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.productItem}
      onPress={() => setSelectedProduct({ ...item, image: getImageSource(item) })}
    >
      <Image 
        source={getImageSource(item)}
        style={styles.productImage} 
        resizeMode="cover"
        fadeDuration={0}
      />
      <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
        {item.name}
      </Text>
      <Text style={styles.productPrice} numberOfLines={1} ellipsizeMode="tail">
        {item.price || 'Contact for pricing'}
      </Text>
      <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
        {item.description}
      </Text>
    </TouchableOpacity>
  ), []);

  // Show detail screen if product is selected
  if (selectedProduct) {
    return (
      <FertilizerDetailScreen 
        product={selectedProduct} 
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="eco" size={32} color="white" />
            <Text style={styles.headerTitle}>Fertilizer Products</Text>
          </View>
          <Text style={styles.headerSubtitle}>Complete range of agricultural fertilizers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5530" />
          <Text style={styles.loadingText}>Loading fertilizer products...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="eco" size={32} color="white" />
            <Text style={styles.headerTitle}>Fertilizer Products</Text>
          </View>
          <Text style={styles.headerSubtitle}>Complete range of agricultural fertilizers</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setError(null);
                setLoading(true);
                // Trigger a re-fetch with cache clearing
                const fetchProducts = async () => {
                  try {
                    clearCache();
                    clearProductCache();
                    const data = await productsApi.getAll({ category: 'fertilizers' });
                    setProducts(data);
                    setLoading(false);
                  } catch (err) {
                    console.error('Error fetching fertilizer products:', err);
                    setError('Failed to load products');
                    setLoading(false);
                  }
                };
                fetchProducts();
              }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="eco" size={32} color="white" />
          <Text style={styles.headerTitle}>Fertilizer Products</Text>
        </View>
        <Text style={styles.headerSubtitle}>Complete range of agricultural fertilizers</Text>
      </View>

      {/* Products List with FlatList for better performance */}
      <FlatList
        data={fertilizerProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={4}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 200,
          offset: 200 * Math.floor(index / 2),
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#2c5530',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  productsContainer: {
    padding: 5,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  productItem: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 2,
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 5,
    marginTop: 0,
  },
  productDescription: {
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2c5530',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2c5530',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FertilizerProductsScreen;
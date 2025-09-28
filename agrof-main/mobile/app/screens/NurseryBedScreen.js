import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { productsApi } from '../services/storeApi';

const NurseryBedScreen = ({ onBack }) => {
  const [nurseryProducts, setNurseryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNurseryProducts();
  }, []);

  const fetchNurseryProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🌱 Fetching nursery bed products...');
      
      const products = await productsApi.getAll({ category: 'nursery_bed' });
      console.log('🌱 Nursery bed products loaded:', products.length);
      
      setNurseryProducts(products);
    } catch (err) {
      console.error('❌ Error fetching nursery products:', err);
      setError('Failed to load nursery products');
    } finally {
      setLoading(false);
    }
  };


  // Optimized product rendering with memoization
  const renderProduct = useCallback(({ item: product }) => (
    <TouchableOpacity style={styles.productItem}>
      <Image 
        source={product.image_url ? { uri: `http://192.168.1.15:3001${product.image_url}` } : require('../assets/nurserybed.png')} 
        style={styles.productImage} 
        resizeMode="cover"
        fadeDuration={0}
        onError={(error) => {
          console.log('❌ Image load error for product', product.id, ':', error);
        }}
      />
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{product.price || 'Contact for pricing'}</Text>
      <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
        {product.description}
      </Text>
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="local_florist" size={32} color="white" />
          <Text style={styles.headerTitle}>Nursery Bed Products</Text>
        </View>
        <Text style={styles.headerSubtitle}>Quality seedlings and plantlets for your garden</Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5530" />
          <Text style={styles.loadingText}>Loading nursery products...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNurseryProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products Grid - Optimized FlatList */}
      {!loading && !error && (
        <FlatList
          data={nurseryProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          style={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={10}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: 280,
            offset: 280 * Math.floor(index / 2),
            index,
          })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 5,
    marginTop: 8,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
    textAlign: 'center',
  },
  productDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    textAlign: 'center',
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
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    zIndex: 1,
  },
});

export default NurseryBedScreen;
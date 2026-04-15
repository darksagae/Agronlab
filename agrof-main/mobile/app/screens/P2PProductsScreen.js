import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabaseConfig';

// Crop image mapping - matches EXACTLY with assets/crops/ folder
// Generated from: ls -1 assets/crops/ | sed 's/.png$//'
const cropImages = {
  // Grains (3 images)
  'Maize': require('../assets/crops/maize.png'),           // maize.png
  'Rice': require('../assets/crops/rice.png'),             // rice.png
  'Millet': require('../assets/crops/millet.png'),         // millet.png
  
  // Legumes (3 images)
  'Beans': require('../assets/crops/beans.png'),           // beans.png
  'Groundnuts': require('../assets/crops/groundnuts.png'), // groundnuts.png
  'Soyabeans': require('../assets/crops/soyabeans.png'),   // soyabeans.png
  
  // Cash Crops (3 images)
  'Coffee': require('../assets/crops/coffee.png'),         // coffee.png
  'Cotton': require('../assets/crops/cotton.png'),         // cotton.png
  'Sugarcane': require('../assets/crops/sugarcane.png'),   // sugarcane.png
  
  // Vegetables (5 images)
  'Tomatoes': require('../assets/crops/tomatoes.png'),     // tomatoes.png
  'Cabbage': require('../assets/crops/cabbage.png'),       // cabbage.png
  'Onions': require('../assets/crops/onions.png'),         // onions.png
  'Carrot': require('../assets/crops/carrot.png'),         // carrot.png
  'Spinach': require('../assets/crops/spinach.png'),       // spinach.png
  
  // Fruits (5 images)
  'Avocados': require('../assets/crops/avocados.png'),     // avocados.png
  'Banana': require('../assets/crops/banana.png'),         // banana.png
  'Mangoes': require('../assets/crops/mangoes.png'),       // mangoes.png
  'Orangoes': require('../assets/crops/orangoes.png'),     // orangoes.png ⚠️ NOTE SPELLING!
  'Pineapple': require('../assets/crops/pineapple.png'),   // pineapple.png
};
// TOTAL: 19 product names = 19 image files (100% match verified!)

function describeFetchError(err) {
  if (err == null) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  if (typeof err === 'object' && typeof err.message === 'string') return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isLikelyNetworkFailure(message) {
  return /network request failed|failed to fetch|network error|load failed|timed out|timeout/i.test(
    message || ''
  );
}

const P2PProductsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  /** null = OK or empty DB; 'network' = unreachable; 'other' = server/schema error */
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setFetchError(null);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('p2p_products')
        .select('*')
        .order('name');

      if (productsError) {
        const msg = describeFetchError(productsError);
        if (isLikelyNetworkFailure(msg)) {
          console.warn('P2P products: cannot reach Supabase (network).', msg);
          setFetchError('network');
        } else {
          console.warn('P2P products: Supabase error.', msg);
          setFetchError('other');
        }
        setProducts([]);
        return;
      }

      if (!productsData || productsData.length === 0) {
        console.warn('P2P products: table empty — seed p2p_products in Supabase if expected.');
        setProducts([]);
        return;
      }

      const productsWithCounts = await Promise.all(
        productsData.map(async (product) => {
          let sellersCount = 0;
          try {
            const { count } = await supabase
              .from('p2p_listings')
              .select('*', { count: 'exact', head: true })
              .eq('p2p_product_id', product.id)
              .eq('is_active', true);
            sellersCount = count || 0;
          } catch {
            sellersCount = 0;
          }

          const buyersCount = 0;
          const trendPrice = product.base_price || 0;
          const trendChange = Math.random() * 5 - 2.5;

          return {
            ...product,
            sellersCount,
            buyersCount,
            trendPrice,
            trendChange,
            trendDirection: trendChange > 0 ? 'up' : trendChange < 0 ? 'down' : 'stable',
          };
        })
      );

      setProducts(productsWithCounts);
    } catch (error) {
      const msg = describeFetchError(error);
      if (isLikelyNetworkFailure(msg)) {
        console.warn('P2P products: request failed (network).', msg);
        setFetchError('network');
      } else {
        console.warn('P2P products: unexpected error.', msg);
        if (error instanceof Error && error.stack) {
          console.warn(error.stack);
        }
        setFetchError('other');
      }
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleProductPress = (product) => {
    console.log('📦 User selected product:', product.name);
    navigation.navigate('ProductTrading', { 
      p2pProduct: product,
      fromP2PMarket: true 
    });
  };

  const getTrendIcon = (direction) => {
    if (direction === 'up') return 'trending-up';
    if (direction === 'down') return 'trending-down';
    return 'trending-flat';
  };

  const getTrendColor = (direction) => {
    if (direction === 'up') return '#4CAF50';
    if (direction === 'down') return '#F44336';
    return '#9E9E9E';
  };

  const renderProductCard = ({ item }) => {
    const trendColor = getTrendColor(item.trendDirection);
    const trendIcon = getTrendIcon(item.trendDirection);
    const cropImage = cropImages[item.name];

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={[styles.iconContainer, { backgroundColor: `${trendColor}20` }]}>
          {cropImage ? (
            <Image 
              source={cropImage} 
              style={styles.cropImage}
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons name="eco" size={40} color={trendColor} />
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>

          {/* AGROF Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>AGROF Price:</Text>
            <Text style={styles.price}>
              {item.trendPrice ? `${item.trendPrice.toLocaleString()} UGX` : 'N/A'}
            </Text>
          </View>

          {/* Trend */}
          <View style={styles.trendRow}>
            <MaterialIcons name={trendIcon} size={16} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {item.trendChange > 0 ? '+' : ''}
              {item.trendChange.toFixed(1)}% this week
            </Text>
          </View>

          {/* Sellers & Buyers Count */}
          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <MaterialIcons name="store" size={16} color="#4CAF50" />
              <Text style={styles.countText}>{item.sellersCount} Sellers</Text>
            </View>
            <View style={styles.countItem}>
              <MaterialIcons name="shopping-cart" size={16} color="#2196F3" />
              <Text style={styles.countText}>{item.buyersCount} Buyers</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <MaterialIcons name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading P2P Market...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>P2P Market</Text>
          <Text style={styles.headerSubtitle}>Trade directly with farmers</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, fetchError === 'network' && styles.infoBannerWarning]}>
        <MaterialIcons
          name={fetchError === 'network' ? 'wifi-off' : 'info'}
          size={20}
          color={fetchError === 'network' ? '#E65100' : '#2196F3'}
        />
        <Text style={[styles.infoBannerText, fetchError === 'network' && styles.infoBannerTextWarning]}>
          {fetchError === 'network'
            ? 'No connection to the server. Check Wi-Fi or mobile data, then pull to refresh.'
            : 'Browse freely • Register to trade • Prices updated daily'}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name={fetchError === 'network' ? 'cloud-off' : 'grass'}
              size={80}
              color="#CCC"
            />
            <Text style={styles.emptyTitle}>
              {fetchError === 'network' ? 'Can’t load products' : 'No P2P Products Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {fetchError === 'network'
                ? 'We couldn’t reach Supabase. Confirm internet access and that your Supabase URL/key in the app match your project.'
                : fetchError === 'other'
                  ? 'Something went wrong loading products. Try again in a moment.'
                  : 'Products need to be added to the database.'}
            </Text>
            {fetchError !== 'network' && fetchError !== 'other' ? (
              <Text style={styles.emptyInstructions}>
                Run: update_p2p_products_with_crops.sql in the Supabase SQL Editor (see project docs).
              </Text>
            ) : null}
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={styles.refreshButtonText}>
                {fetchError === 'network' ? 'Retry' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  infoBannerWarning: {
    backgroundColor: '#FFF3E0',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1976D2',
    flex: 1,
  },
  infoBannerTextWarning: {
    color: '#BF360C',
  },
  listContent: {
    padding: 15,
    paddingBottom: 60, // Extra padding at bottom to prevent cutoff by nav tabs
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  countsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyInstructions: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 10,
    fontFamily: 'monospace',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default P2PProductsScreen;




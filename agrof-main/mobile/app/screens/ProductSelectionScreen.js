import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../config/supabaseConfig';

const ProductSelectionScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [p2pProducts, setP2pProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadP2PProducts();
  }, []);

  const loadP2PProducts = async () => {
    try {
      console.log('📦 Loading P2P products...');
      
      const { data, error } = await supabase
        .from('p2p_products')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      console.log('✅ Loaded', data.length, 'P2P products');
      setP2pProducts(data);
    } catch (error) {
      console.error('❌ Error loading P2P products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      // Deselect
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      // Select
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const isSelected = (productId) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      Alert.alert('No Products Selected', 'Please select at least one product to sell');
      return;
    }

    console.log('✅ Products selected:', selectedProducts.length);
    console.log('   Products:', selectedProducts.map(p => p.name));

    // Navigate to price/quantity input screen with params
    navigation.navigate('PriceQuantityInput', { 
      selectedProducts: selectedProducts,
      sellerId: user.uid 
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Grains': 'grain',
      'Cash Crops': 'local-cafe',
      'Legumes': 'eco',
      'Oilseeds': 'opacity',
      'Tubers': 'spa',
      'Vegetables': 'local-florist',
    };
    return icons[category] || 'category';
  };

  // Group products by category
  const productsByCategory = p2pProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading P2P Market Products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Products to Sell</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <MaterialIcons name="info" size={24} color="#4CAF50" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.instructionsTitle}>Choose Your Products</Text>
            <Text style={styles.instructionsText}>
              Select the products you want to sell in the P2P market. You'll set your own prices and quantities in the next step.
            </Text>
          </View>
        </View>

        {/* Selected Count */}
        <View style={styles.selectedCountCard}>
          <MaterialIcons name="shopping-basket" size={20} color="#4CAF50" />
          <Text style={styles.selectedCountText}>
            {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'} selected
          </Text>
        </View>

        {/* Products by Category */}
        {Object.keys(productsByCategory).sort().map((category) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <MaterialIcons name={getCategoryIcon(category)} size={24} color="#4CAF50" />
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>
                ({productsByCategory[category].length})
              </Text>
            </View>

            {productsByCategory[category].map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  isSelected(product.id) && styles.productCardSelected
                ]}
                onPress={() => toggleProduct(product)}
              >
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={[
                      styles.productName,
                      isSelected(product.id) && styles.productNameSelected
                    ]}>
                      {product.name}
                    </Text>
                    {isSelected(product.id) && (
                      <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                    )}
                  </View>
                  <Text style={styles.productUnit}>
                    {product.unit_of_measure}
                    {product.standard_unit_size ? ` (${product.standard_unit_size})` : ''}
                  </Text>
                  {product.description && (
                    <Text style={styles.productDescription}>{product.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={() => {
            if (selectedProducts.length === p2pProducts.length) {
              setSelectedProducts([]);
            } else {
              setSelectedProducts([...p2pProducts]);
            }
          }}
        >
          <MaterialIcons 
            name={selectedProducts.length === p2pProducts.length ? "check-box" : "check-box-outline-blank"} 
            size={20} 
            color="#4CAF50" 
          />
          <Text style={styles.selectAllText}>
            {selectedProducts.length === p2pProducts.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedProducts.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedProducts.length === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                Continue ({selectedProducts.length})
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
  },
  content: {
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: '#E8F5E8',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  selectedCountCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 1,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  productCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  productCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F1',
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  productNameSelected: {
    color: '#2c5530',
  },
  productUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  productDescription: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  bottomBar: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 5,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  selectAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductSelectionScreen;
















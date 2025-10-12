import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeTranslation } from '../i18n';
import { productsApi } from '../services/storeApi';
import storeImageService from '../services/storeImageService';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { t } = useSafeTranslation();
  const { currentLanguage } = useLanguage();
  const { productId, product } = route.params;
  const [productData, setProductData] = useState(product || null);
  const [loading, setLoading] = useState(!product);
  const [imageLoading, setImageLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart, isInCart, getItemQuantity } = useCart();

  useEffect(() => {
    if (!product && productId) {
      loadProduct();
    }
  }, [productId, currentLanguage]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getById(productId, currentLanguage);
      setProductData(data);
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert(t('common.error'), t('common.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!productData) return;

    setAddingToCart(true);
    try {
      const result = await addToCart({
        ...productData,
        quantity: quantity,
        unit: selectedUnit || 'piece'
      });
      
      if (result.success) {
        Alert.alert(
          'Added to Cart', 
          `${quantity} ${selectedUnit || 'piece'} of ${productData.name} added to cart!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to add item to cart');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContactSeller = () => {
    Alert.alert(
      'Contact Seller',
      'Phone: +256 700 123 456\nEmail: sales@agrof.com\nWhatsApp: +256 700 123 456',
      [
        { text: 'Call', onPress: () => console.log('Call seller') },
        { text: 'WhatsApp', onPress: () => console.log('Open WhatsApp') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getCategoryImage = (categoryName) => {
    const imageMap = {
      'fertilizers': require('../assets/fertilizers.png'),
      'fungicides': require('../assets/fungicides.png'),
      'herbicides': require('../assets/herbicides.png'),
      'nursery_bed': require('../assets/nurserybed.png'),
      'organic_chemicals': require('../assets/organic_chemicals.png'),
      'seeds': require('../assets/seeds.png'),
    };
    return imageMap[categoryName] || require('../assets/fertilizers.png');
  };

  const formatPrice = (priceText) => {
    if (!priceText) return 'Contact for pricing';
    
    // Extract the first price found
    const priceMatch = priceText.match(/UGX\s*([0-9,]+(?:\.[0-9]+)?)/i);
    if (priceMatch) {
      return `UGX ${parseInt(priceMatch[1].replace(/,/g, '')).toLocaleString()}`;
    }
    
    return priceText;
  };

  const parseSpecifications = (specs) => {
    if (!specs) return [];
    
    // Clean up the specifications and convert to array
    const cleanSpecs = specs
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/•/g, '') // Remove bullet points
      .split('\n')
      .filter(line => line.trim() && line.includes(':'))
      .map(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        return { key, value };
      });
    
    return cleanSpecs;
  };

  const parseFeatures = (features) => {
    if (!features) return [];
    
    return features
      .replace(/\*\*/g, '')
      .replace(/•/g, '')
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </View>
    );
  }

  if (!productData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={80} color="#ccc" />
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <Text style={styles.errorSubtitle}>The product you're looking for doesn't exist</Text>
        </View>
      </View>
    );
  }

  const cartQuantity = getItemQuantity(productData.id);
  const inCart = isInCart(productData.id);
  const specifications = parseSpecifications(productData.specifications);
  const features = parseFeatures(productData.features);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {productData.name}
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialIcons name="share" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          )}
          <Image
            source={storeImageService.getProductImage(productData)}
            style={styles.productImage}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          {inCart && (
            <View style={styles.cartBadge}>
              <MaterialIcons name="shopping-cart" size={16} color="white" />
              <Text style={styles.cartBadgeText}>{cartQuantity}</Text>
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{productData.name}</Text>
          <Text style={styles.productCategory}>{productData.category_display_name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{formatPrice(productData.price)}</Text>
            <View style={styles.availabilityContainer}>
              <MaterialIcons 
                name="check-circle" 
                size={16} 
                color={productData.availability === 'In Stock' ? '#4CAF50' : '#FF5722'} 
              />
              <Text style={[
                styles.availabilityText, 
                { color: productData.availability === 'In Stock' ? '#4CAF50' : '#FF5722' }
              ]}>
                {productData.availability}
              </Text>
            </View>
          </View>

          {/* Description */}
          {productData.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('productDetails.description')}</Text>
              <Text style={styles.sectionContent}>{productData.description}</Text>
            </View>
          )}

          {/* Specifications */}
          {specifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('productDetails.specifications')}</Text>
              <View style={styles.specsContainer}>
                {specifications.map((spec, index) => (
                  <View key={index} style={styles.specRow}>
                    <Text style={styles.specKey}>{spec.key}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Key Features */}
          {features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('productDetails.keyFeatures')}</Text>
              <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <MaterialIcons name="check" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Usage Instructions */}
          {productData.usage_instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('productDetails.usageInstructions')}</Text>
              <Text style={styles.sectionContent}>
                {productData.usage_instructions.replace(/\*\*/g, '').replace(/•/g, '• ')}
              </Text>
            </View>
          )}

          {/* Benefits */}
          {productData.benefits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('productDetails.benefits')}</Text>
              <Text style={styles.sectionContent}>
                {productData.benefits.replace(/\*\*/g, '').replace(/•/g, '• ')}
              </Text>
            </View>
          )}
        </View>

        {/* Quantity and Unit Selection */}
        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>Order Details</Text>
          
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <MaterialIcons name="remove" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setQuantity(Math.max(1, num));
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialIcons name="add" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.unitContainer}>
            <Text style={styles.unitLabel}>Unit:</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity 
                style={[styles.unitButton, selectedUnit === 'piece' && styles.unitButtonActive]}
                onPress={() => setSelectedUnit('piece')}
              >
                <Text style={[styles.unitButtonText, selectedUnit === 'piece' && styles.unitButtonTextActive]}>
                  Piece
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unitButton, selectedUnit === 'kg' && styles.unitButtonActive]}
                onPress={() => setSelectedUnit('kg')}
              >
                <Text style={[styles.unitButtonText, selectedUnit === 'kg' && styles.unitButtonTextActive]}>
                  Kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unitButton, selectedUnit === 'bag' && styles.unitButtonActive]}
                onPress={() => setSelectedUnit('bag')}
              >
                <Text style={[styles.unitButtonText, selectedUnit === 'bag' && styles.unitButtonTextActive]}>
                  Bag
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.contactButton} 
          onPress={handleContactSeller}
        >
          <MaterialIcons name="phone" size={20} color="#4CAF50" />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.addToCartButton, inCart && styles.addToCartButtonActive]} 
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialIcons 
                name={inCart ? "shopping-cart" : "add-shopping-cart"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.addToCartButtonText}>
                {inCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
              </Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c5530',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginHorizontal: 10,
  },
  shareButton: {
    padding: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: 'white',
    marginBottom: 10,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  cartBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  specsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  specKey: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  specValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  featuresContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  selectionCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 15,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 5,
  },
  quantityButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
    elevation: 1,
  },
  quantityInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 3,
  },
  unitButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  unitButtonActive: {
    backgroundColor: '#4CAF50',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  contactButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addToCartButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
  },
  addToCartButtonActive: {
    backgroundColor: '#45a049',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProductDetailScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabaseConfig';

const PriceQuantityInputScreen = ({ route, navigation }) => {
  const { selectedProducts, sellerId } = route?.params || { selectedProducts: [], sellerId: null };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // Store pricing data for all products
  const [productPricing, setProductPricing] = useState(
    selectedProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      unit: product.unit_of_measure,
      askingPrice: '',
      quantity: '',
      minOrder: '1',
      location: 'Kampala',
      notes: '',
    }))
  );

  const currentProduct = selectedProducts[currentIndex];
  const currentPricing = productPricing[currentIndex];

  const updateCurrentPricing = (field, value) => {
    const updated = [...productPricing];
    updated[currentIndex] = {
      ...updated[currentIndex],
      [field]: value
    };
    setProductPricing(updated);
  };

  const handleNext = () => {
    // Validate current product
    if (!currentPricing.askingPrice || parseFloat(currentPricing.askingPrice) <= 0) {
      Alert.alert('Price Required', 'Please enter a valid price');
      return;
    }

    if (!currentPricing.quantity || parseInt(currentPricing.quantity) <= 0) {
      Alert.alert('Quantity Required', 'Please enter a valid quantity');
      return;
    }

    if (currentIndex < selectedProducts.length - 1) {
      // Go to next product
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last product - submit all
      handleSubmitAll();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);

    try {
      console.log('💾 Submitting', productPricing.length, 'P2P listings...');

      // Prepare all listings
      const listings = productPricing.map(pricing => ({
        seller_id: sellerId,
        p2p_product_id: pricing.productId,
        asking_price: parseFloat(pricing.askingPrice),
        quantity_available: parseInt(pricing.quantity),
        minimum_order_quantity: parseInt(pricing.minOrder) || 1,
        location: pricing.location,
        notes: pricing.notes,
        is_active: true
      }));

      // Insert all listings
      const { data, error } = await supabase
        .from('p2p_listings')
        .upsert(listings, { onConflict: 'seller_id,p2p_product_id' })
        .select();

      if (error) throw error;

      console.log('✅ Created', data.length, 'P2P listings');

      Alert.alert(
        '🎉 Products Listed Successfully!',
        `You have listed ${data.length} products in the P2P market!\n\nBuyers can now see your offers with your prices and contact you directly.`,
        [{
          text: 'Done',
          onPress: () => {
            // Navigate back to Account main screen
            navigation.navigate('main');
          }
        }]
      );

    } catch (error) {
      console.error('❌ Error creating P2P listings:', error);
      Alert.alert('Error', error.message || 'Failed to create listings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Price & Quantity</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            Product {currentIndex + 1} of {selectedProducts.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / selectedProducts.length) * 100}%` }
            ]} />
          </View>
        </View>

        {/* Current Product Info */}
        <View style={styles.productInfoCard}>
          <MaterialIcons name="inventory" size={32} color="#4CAF50" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.productTitle}>{currentProduct.name}</Text>
            <Text style={styles.productSubtitle}>
              {currentProduct.category} • {currentProduct.unit_of_measure}
            </Text>
            {currentProduct.standard_unit_size && (
              <Text style={styles.productSize}>
                Standard size: {currentProduct.standard_unit_size}
              </Text>
            )}
          </View>
        </View>

        {/* Pricing Form */}
        <View style={styles.formSection}>
          {/* Asking Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Selling Price *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencyLabel}>UGX</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="50000"
                value={currentPricing.askingPrice}
                onChangeText={(text) => updateCurrentPricing('askingPrice', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.hint}>
              Set your competitive price {currentProduct.unit_of_measure}
            </Text>
          </View>

          {/* Quantity Available */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity Available *</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              value={currentPricing.quantity}
              onChangeText={(text) => updateCurrentPricing('quantity', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              How many {currentProduct.unit_of_measure} do you have?
            </Text>
          </View>

          {/* Minimum Order */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Order Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={currentPricing.minOrder}
              onChangeText={(text) => updateCurrentPricing('minOrder', text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              Minimum quantity buyers must order
            </Text>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kampala, Mbale"
              value={currentPricing.location}
              onChangeText={(text) => updateCurrentPricing('location', text)}
            />
            <Text style={styles.hint}>
              Where buyers can collect or where you can deliver from
            </Text>
          </View>

          {/* Additional Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Organic certified, Fresh harvest, Delivery available..."
              value={currentPricing.notes}
              onChangeText={(text) => updateCurrentPricing('notes', text)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Preview Card */}
          {currentPricing.askingPrice && currentPricing.quantity && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Listing Preview:</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Product:</Text>
                <Text style={styles.previewValue}>{currentProduct.name}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Your Price:</Text>
                <Text style={styles.previewValue}>
                  UGX {parseInt(currentPricing.askingPrice).toLocaleString()} {currentProduct.unit_of_measure}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Quantity:</Text>
                <Text style={styles.previewValue}>{currentPricing.quantity} available</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Location:</Text>
                <Text style={styles.previewValue}>{currentPricing.location}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationBar}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <MaterialIcons name="arrow-back" size={20} color="#4CAF50" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentIndex === 0 && { flex: 1 }
          ]}
          onPress={handleNext}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentIndex === selectedProducts.length - 1 ? 'Submit All Listings' : 'Next Product'}
              </Text>
              <MaterialIcons name={currentIndex === selectedProducts.length - 1 ? "check" : "arrow-forward"} size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  progressCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 1,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  productInfoCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
  },
  productSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  productSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  formSection: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingLeft: 12,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  previewCard: {
    backgroundColor: '#F0F7FF',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 13,
    color: '#666',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  navigationBar: {
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
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  previousButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  nextButton: {
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
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PriceQuantityInputScreen;
















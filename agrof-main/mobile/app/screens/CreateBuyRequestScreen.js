import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../config/supabaseConfig';

const CreateBuyRequestScreen = ({ navigation }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    p2pProductId: '',
    productName: '',
    title: '',
    description: '',
    quantityNeeded: '',
    targetPrice: '',
    maxPrice: '',
    location: '',
    deliveryNeeded: true,
    urgency: 'normal',
  });

  useEffect(() => {
    loadP2PProducts();
  }, []);

  const loadP2PProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('p2p_products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleProductChange = (product) => {
    setFormData({
      ...formData,
      p2pProductId: product.id,
      productName: product.name,
    });
    setShowProductPicker(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.p2pProductId) {
      Alert.alert('Missing Information', 'Please select a product');
      return;
    }
    if (!formData.title || !formData.quantityNeeded || !formData.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('buy_requests')
        .insert([{
          buyer_id: user.uid,
          p2p_product_id: formData.p2pProductId,
          title: formData.title,
          description: formData.description,
          quantity_needed: parseInt(formData.quantityNeeded),
          target_price: formData.targetPrice ? parseFloat(formData.targetPrice) : null,
          max_price: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          location: formData.location,
          delivery_needed: formData.deliveryNeeded,
          urgency: formData.urgency,
          status: 'active',
          is_active: true,
        }])
        .select();

      if (error) throw error;

      Alert.alert(
        '✅ Buy Request Posted!',
        `Your request for ${formData.productName} has been posted!\n\nSellers can now see your request and send you offers.`,
        [
          {
            text: 'View My Requests',
            onPress: () => navigation.navigate('P2PMarketPanel'),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating buy request:', error);
      Alert.alert('Error', 'Failed to post buy request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'normal': return '#4CAF50';
      case 'low': return '#9E9E9E';
      default: return '#4CAF50';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Buy Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color="#2196F3" />
          <Text style={styles.infoBannerText}>
            Post what you want to buy and let sellers contact you with offers!
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Select Product */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProductPicker(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.productName && styles.pickerPlaceholder]}>
                {formData.productName || 'Select a product...'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Product Picker Modal */}
          <Modal
            visible={showProductPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowProductPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Product</Text>
                  <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                    <MaterialIcons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={products}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.productOption}
                      onPress={() => handleProductChange(item)}
                    >
                      <Text style={styles.productOptionName}>{item.name}</Text>
                      <Text style={styles.productOptionCategory}>{item.category}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Request Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Looking to buy fresh tomatoes"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add more details about what you need..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity Needed *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              value={formData.quantityNeeded}
              onChangeText={(text) => setFormData({ ...formData, quantityNeeded: text })}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Enter the amount you want to buy</Text>
          </View>

          {/* Target Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Price (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50000"
              value={formData.targetPrice}
              onChangeText={(text) => setFormData({ ...formData, targetPrice: text })}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Your ideal price in UGX</Text>
          </View>

          {/* Max Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Price (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60000"
              value={formData.maxPrice}
              onChangeText={(text) => setFormData({ ...formData, maxPrice: text })}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Highest price you'll pay in UGX</Text>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kampala, Nakasero"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          {/* Delivery Needed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  formData.deliveryNeeded && styles.toggleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, deliveryNeeded: true })}
              >
                <MaterialIcons
                  name="local-shipping"
                  size={20}
                  color={formData.deliveryNeeded ? 'white' : '#666'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    formData.deliveryNeeded && styles.toggleTextActive,
                  ]}
                >
                  I need delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !formData.deliveryNeeded && styles.toggleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, deliveryNeeded: false })}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={!formData.deliveryNeeded ? 'white' : '#666'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    !formData.deliveryNeeded && styles.toggleTextActive,
                  ]}
                >
                  I can pickup
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Urgency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Urgency</Text>
            <View style={styles.urgencyRow}>
              {['low', 'normal', 'high', 'urgent'].map((urgency) => (
                <TouchableOpacity
                  key={urgency}
                  style={[
                    styles.urgencyButton,
                    formData.urgency === urgency && {
                      backgroundColor: getUrgencyColor(urgency),
                      borderColor: getUrgencyColor(urgency),
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, urgency })}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      formData.urgency === urgency && styles.urgencyTextActive,
                    ]}
                  >
                    {urgency.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Post Buy Request</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields{'\n'}
            Your request will be visible to all sellers
          </Text>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    gap: 10,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1976D2',
    flex: 1,
  },
  form: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
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
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  productOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productOptionCategory: {
    fontSize: 13,
    color: '#666',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: 'white',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  urgencyButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  urgencyTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default CreateBuyRequestScreen;




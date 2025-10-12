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
import { useUser } from '../contexts/UserContext';
import { supabase } from '../config/supabaseConfig';

const InquiryFormScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { seller, listing, p2pProduct } = route?.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    location: user?.contactInfo?.city || '',
    message: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    if (!formData.message.trim()) {
      Alert.alert('Missing Message', 'Please enter a message for the seller');
      return;
    }

    setLoading(true);

    try {
      console.log('📨 Sending inquiry to seller:', seller.uid);

      // Create inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .from('p2p_inquiries')
        .insert([
          {
            listing_id: listing.id,
            buyer_id: user.uid,
            seller_id: seller.uid,
            p2p_product_id: p2pProduct.id,
            quantity_needed: parseInt(formData.quantity),
            buyer_location: formData.location,
            message: formData.message.trim(),
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (inquiryError) throw inquiryError;

      console.log('✅ Inquiry created:', inquiry.id);

      // Create initial message
      const { error: messageError } = await supabase
        .from('inquiry_messages')
        .insert([
          {
            inquiry_id: inquiry.id,
            sender_id: user.uid,
            message: formData.message.trim(),
            is_read: false,
          },
        ]);

      if (messageError) throw messageError;

      console.log('✅ Initial message sent');

      Alert.alert(
        '✅ Inquiry Sent!',
        `Your inquiry has been sent to ${seller.fullName || 'the seller'}.\n\nYou can now chat with them!`,
        [
          {
            text: 'Open Chat',
            onPress: () => {
              navigation.navigate('Conversation', { inquiryId: inquiry.id });
            },
          },
          {
            text: 'Later',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error sending inquiry:', error);
      Alert.alert('Error', error.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Seller</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seller Info */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerHeader}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={32} color="#4CAF50" />
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{seller?.fullName || 'Seller'}</Text>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.ratingText}>
                  {seller?.p2p_rating?.toFixed(1) || '5.0'} ({seller?.p2p_total_trades || 0} trades)
                </Text>
              </View>
            </View>
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productLabel}>Product:</Text>
            <Text style={styles.productName}>{p2pProduct?.name}</Text>
          </View>

          <View style={styles.priceInfo}>
            <View>
              <Text style={styles.priceLabel}>Seller's Price:</Text>
              <Text style={styles.price}>{listing?.asking_price?.toLocaleString()} UGX</Text>
            </View>
            <View>
              <Text style={styles.priceLabel}>Available:</Text>
              <Text style={styles.available}>{listing?.quantity_available} {p2pProduct?.unit}</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Your Inquiry</Text>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Quantity Needed * <Text style={styles.unit}>({p2pProduct?.unit})</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`e.g., 50 ${p2pProduct?.unit}`}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="number-pad"
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kampala, Jinja, Mbale"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
            <Text style={styles.hint}>This helps the seller plan delivery</Text>
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message to Seller *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Hello! I'm interested in buying your maize. Can we discuss delivery options?"
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>
              Be clear about your needs, timeline, and payment method
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              The seller will receive your inquiry and can respond with their availability and
              terms. All communications are tracked in your P2P Market inbox.
            </Text>
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
                <Text style={styles.submitButtonText}>Send Inquiry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  sellerCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 16,
    borderRadius: 15,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
  },
  productInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 12,
  },
  productLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  available: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  form: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 16,
    borderRadius: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 16,
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
  unit: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
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
    height: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InquiryFormScreen;





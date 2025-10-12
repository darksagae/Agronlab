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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../config/supabaseConfig';

const BuyerRequestScreen = ({ navigation }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    shippingAddress: '',
    city: 'Kampala',
    district: '',
    location: '',
    preferredPaymentMethod: 'Mobile Money',
    specialRequests: '',
  });

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    // Validate required fields
    if (!formData.city || !formData.location) {
      Alert.alert('Missing Information', 'Please fill in your city and location');
      return;
    }

    setLoading(true);

    try {
      console.log('🛒 Creating buyer profile for:', user.uid);

      // Create buyer entry in Supabase
      const { data, error } = await supabase
        .from('buyers')
        .insert({
          id: user.uid,  // Same as user ID
          shipping_address: {
            street: formData.shippingAddress,
            city: formData.city,
            district: formData.district,
            location: formData.location,
            country: 'Uganda'
          },
          billing_address: {
            street: formData.shippingAddress,
            city: formData.city,
            district: formData.district,
            country: 'Uganda'
          },
          default_payment_method: formData.preferredPaymentMethod,
          total_orders: 0,
          total_spent: 0,
          loyalty_points: 0,
          preferences: {
            special_requests: formData.specialRequests
          }
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already exists
          Alert.alert(
            'Already Registered',
            'You are already registered as a buyer!',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        throw error;
      }

      console.log('✅ Buyer profile created:', data);

      // Update user_type to buyer or both
      const { data: currentUserData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.uid)
        .single();

      const newUserType = currentUserData?.user_type === 'seller' ? 'both' : 'buyer';
      
      await supabase
        .from('users')
        .update({ user_type: newUserType })
        .eq('id', user.uid);

      console.log('✅ User type updated to:', newUserType);

      Alert.alert(
        '🎉 Registration Complete!',
        'You are now registered as a buyer!\n\n✅ Access to P2P Market unlocked!\n\nYou can now:\n• View seller listings\n• Negotiate prices\n• Contact sellers directly\n• Trade agricultural products',
        [{ text: 'Explore P2P Market', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('❌ Error creating buyer profile:', error);
      Alert.alert('Error', error.message || 'Failed to register as buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register as Buyer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="shopping-cart" size={48} color="#4CAF50" />
          <Text style={styles.infoTitle}>Become an AGROF Buyer</Text>
          <Text style={styles.infoText}>
            Register as a buyer to access our full marketplace, track orders, and enjoy exclusive benefits!
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kampala"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>

          {/* District */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Wakiso"
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
            />
          </View>

          {/* Location/Area */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location/Area *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Ntinda, Kololo"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          {/* Shipping Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your street address, building, or landmark"
              value={formData.shippingAddress}
              onChangeText={(text) => setFormData({ ...formData, shippingAddress: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <Text style={styles.sectionTitle}>Payment Preferences</Text>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Payment Method</Text>
            <View style={styles.paymentOptions}>
              {['Mobile Money', 'Cash on Delivery', 'Bank Transfer'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentOption,
                    formData.preferredPaymentMethod === method && styles.paymentOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, preferredPaymentMethod: method })}
                >
                  <Text style={[
                    styles.paymentOptionText,
                    formData.preferredPaymentMethod === method && styles.paymentOptionTextActive
                  ]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Requests */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Special Requests (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special delivery instructions or preferences..."
              value={formData.specialRequests}
              onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Buyer Benefits:</Text>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Access to verified sellers</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Track your orders in real-time</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Earn loyalty points</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Secure payment options</Text>
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
                <MaterialIcons name="shopping-cart" size={20} color="white" />
                <Text style={styles.submitButtonText}>Complete Registration</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields
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
  infoCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5530',
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 15,
    marginTop: 10,
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
    height: 80,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    gap: 10,
  },
  paymentOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  paymentOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paymentOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  benefitsCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default BuyerRequestScreen;
















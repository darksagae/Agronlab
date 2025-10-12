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
import roleRequestService from '../services/roleRequestService';

const SellerRequestScreen = ({ navigation }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessLicense: '',
    taxId: '',
    businessDescription: '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    city: 'Kampala',
    district: '',
    street: '',
  });

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    // Validate required fields
    if (!formData.businessName || !formData.contactPhone) {
      Alert.alert('Missing Information', 'Please fill in Business Name and Contact Phone');
      return;
    }

    setLoading(true);

    try {
      console.log('🏪 Submitting seller request for:', user.uid);

      const requestData = {
        businessName: formData.businessName,
        businessLicense: formData.businessLicense,
        taxId: formData.taxId,
        businessDescription: formData.businessDescription,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        businessAddress: {
          street: formData.street,
          city: formData.city,
          district: formData.district,
          country: 'Uganda'
        },
        documents: null,
      };

      const result = await roleRequestService.submitSellerRequest(requestData);

      if (result.success) {
        console.log('✅ Seller request submitted:', result.request);

        Alert.alert(
          '🎉 Request Submitted!',
          'Your seller request has been submitted for review.\n\nWhat happens next:\n\n1. Admin reviews your application\n2. You\'ll receive a notification\n3. Once approved, you can start listing products!\n\nTypical review time: 1-2 business days',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit request');
      }

    } catch (error) {
      console.error('❌ Error submitting seller request:', error);
      Alert.alert('Error', error.message || 'Failed to submit seller request');
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
        <Text style={styles.headerTitle}>Register as Seller</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="store" size={48} color="#4CAF50" />
          <Text style={styles.infoTitle}>Become an AGROF Seller</Text>
          <Text style={styles.infoText}>
            Register as a seller to list your agricultural products and reach thousands of farmers across Uganda!
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., SAGA Farms Ltd"
              value={formData.businessName}
              onChangeText={(text) => setFormData({ ...formData, businessName: text })}
            />
          </View>

          {/* Business License */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., UG123456789"
              value={formData.businessLicense}
              onChangeText={(text) => setFormData({ ...formData, businessLicense: text })}
            />
            <Text style={styles.hint}>Optional - but recommended for faster approval</Text>
          </View>

          {/* Tax ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tax ID / TIN</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1000123456"
              value={formData.taxId}
              onChangeText={(text) => setFormData({ ...formData, taxId: text })}
            />
            <Text style={styles.hint}>Optional - helps with invoicing</Text>
          </View>

          {/* Business Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your business, what products you sell, your experience..."
              value={formData.businessDescription}
              onChangeText={(text) => setFormData({ ...formData, businessDescription: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <Text style={styles.sectionTitle}>Business Location</Text>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
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

          {/* Street Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street/Plot Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Plot 123, Main Street"
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
            />
          </View>

          <Text style={styles.sectionTitle}>Contact Information</Text>

          {/* Contact Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="+256 700 000 000"
              value={formData.contactPhone}
              onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
              keyboardType="phone-pad"
            />
          </View>

          {/* Contact Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Email</Text>
            <TextInput
              style={styles.input}
              placeholder="business@example.com"
              value={formData.contactEmail}
              onChangeText={(text) => setFormData({ ...formData, contactEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Seller Benefits:</Text>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>List unlimited products</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Reach thousands of buyers</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Set your own prices</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Track sales and earnings</Text>
            </View>
            <View style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Low commission rates</Text>
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
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields{'\n'}
            Your request will be reviewed within 1-2 business days
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
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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
    lineHeight: 16,
  },
});

export default SellerRequestScreen;



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
import { sendEncryptedMessage, fetchRecipientPublicKey } from '../services/chatService';
import { makeChatId } from '../services/cryptoService';

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
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }
    if (!formData.message.trim()) {
      Alert.alert('Missing Message', 'Please enter a message for the seller');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Sign In Required', 'You must be signed in to contact sellers.');
      return;
    }

    const sellerSub = seller?.uid || seller?.id;
    if (!sellerSub) {
      Alert.alert('Error', 'Unable to identify seller. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Check seller has encryption key
      const recipientKey = await fetchRecipientPublicKey(sellerSub);
      if (!recipientKey) {
        Alert.alert(
          'Seller Unavailable',
          'This seller has not set up encrypted messaging yet. Please try again later or refresh the listing.'
        );
        setLoading(false);
        return;
      }

      const fullMessage = [
        formData.message.trim(),
        `Quantity needed: ${formData.quantity} ${p2pProduct?.unit || 'units'}`,
        formData.location ? `Buyer location: ${formData.location}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const result = await sendEncryptedMessage({
        fromSub: user.uid,
        toSub: sellerSub,
        plaintext: fullMessage,
      });

      if (!result.success) {
        if (result.error === 'RECIPIENT_NO_KEY') {
          Alert.alert('Seller Unavailable', 'This seller has not set up encrypted messaging yet.');
        } else {
          Alert.alert('Error', result.error || 'Failed to send inquiry. Please try again.');
        }
        return;
      }

      const chatId = makeChatId(user.uid, sellerSub);

      Alert.alert(
        'Inquiry Sent',
        `Your encrypted message has been sent to ${seller?.fullName || 'the seller'}. Open the chat to continue the conversation.`,
        [
          {
            text: 'Open Chat',
            onPress: () =>
              navigation.navigate('Conversation', {
                chatId,
                otherUserSub: sellerSub,
                otherUserName: seller?.fullName || 'Farmer',
                productName: p2pProduct?.name || listing?.title || 'Product',
              }),
          },
          { text: 'Later', onPress: () => navigation.goBack() },
        ]
      );
    } catch (err) {
      console.error('[InquiryFormScreen] handleSubmit error:', err);
      Alert.alert('Error', 'Failed to send inquiry. Please check your connection.');
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
        <View style={styles.lockBadge}>
          <MaterialIcons name="lock" size={14} color="#4CAF50" />
          <Text style={styles.lockText}>E2E</Text>
        </View>
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
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={14} color="#2196F3" />
                <Text style={styles.verifiedText}>Verified Farmer</Text>
              </View>
            </View>
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productLabel}>Product:</Text>
            <Text style={styles.productName}>{p2pProduct?.name}</Text>
          </View>

          <View style={styles.priceInfo}>
            <View>
              <Text style={styles.priceLabel}>Listed Price:</Text>
              <Text style={styles.price}>{listing?.priceLabel || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Encryption notice */}
        <View style={styles.encryptionBanner}>
          <MaterialIcons name="lock" size={16} color="#2c5530" />
          <Text style={styles.encryptionText}>
            Messages are end-to-end encrypted using NaCl. Only you and the seller can read them.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Your Inquiry</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Quantity Needed * <Text style={styles.unit}>({p2pProduct?.unit || 'units'})</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={`e.g., 50 ${p2pProduct?.unit || 'units'}`}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kampala, Jinja, Mbale"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
            <Text style={styles.hint}>Helps the seller plan delivery</Text>
          </View>

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
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="lock" size={18} color="white" />
                <Text style={styles.submitButtonText}>Send Encrypted Inquiry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default InquiryFormScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2c5530', flex: 1, marginLeft: 8 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  lockText: { fontSize: 11, fontWeight: '700', color: '#4CAF50' },
  content: { flex: 1 },
  sellerCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 16,
    borderRadius: 15,
    elevation: 2,
  },
  sellerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: '#2196F3' },
  productInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 12,
  },
  productLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: '600', color: '#2c5530' },
  priceInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '600', color: '#4CAF50' },
  encryptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 15,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  encryptionText: { flex: 1, fontSize: 12, color: '#2c5530', lineHeight: 17 },
  form: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 8,
    padding: 16,
    borderRadius: 15,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2c5530', marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  unit: { fontSize: 12, color: '#999', fontWeight: '400' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  submitButtonDisabled: { backgroundColor: '#CCC' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

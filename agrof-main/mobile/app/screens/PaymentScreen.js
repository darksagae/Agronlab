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
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { activateSubscription, PLAN_PRICE_UGX } from '../services/subscriptionService';
import apiConfig from '../config/apiConfig';

const NETWORKS = [
  { id: 'MTN', label: 'MTN Mobile Money', color: '#FFCB00', icon: 'phone-android' },
  { id: 'AIRTEL', label: 'Airtel Money', color: '#E40000', icon: 'phone-android' },
];

const PaymentScreen = ({ navigation }) => {
  const { user } = useUser();
  const { refresh } = useSubscription();
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState(user?.phone?.replace(/\D/g, '') || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'pending' | 'success'
  const [txRef, setTxRef] = useState(null);

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('256')) return digits;
    if (digits.startsWith('0')) return `256${digits.slice(1)}`;
    return `256${digits}`;
  };

  const validatePhone = () => {
    const formatted = formatPhone(phone);
    if (formatted.length < 12) return false;
    if (network === 'MTN' && !['25676', '25677', '25678', '25639'].some((p) => formatted.startsWith(p))) {
      Alert.alert('Invalid Number', 'Please enter a valid MTN Uganda number (e.g. 0767...)');
      return false;
    }
    if (network === 'AIRTEL' && !['25670', '25675'].some((p) => formatted.startsWith(p))) {
      Alert.alert('Invalid Number', 'Please enter a valid Airtel Uganda number (e.g. 0701...)');
      return false;
    }
    return true;
  };

  const handleInitiate = async () => {
    if (!validatePhone()) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!user?.uid) {
      Alert.alert('Sign In Required', 'You must be signed in to subscribe.');
      return;
    }

    setLoading(true);
    setStep('pending');

    try {
      const formattedPhone = formatPhone(phone);
      const ref = `AGRON-${user.uid.slice(0, 8)}-${Date.now()}`;
      setTxRef(ref);

      // Call store-backend to initiate Flutterwave charge
      const storeBase = apiConfig?.STORE?.API_URL?.replace('/api/store', '') || 'http://localhost:3001';
      const res = await fetch(`${storeBase}/api/payment/initiate-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSub: user.uid,
          phone: formattedPhone,
          network,
          txRef: ref,
          amount: PLAN_PRICE_UGX,
          currency: 'UGX',
          email: user.email || `${user.uid}@agron.app`,
          name: user.fullName || user.username || 'AGRON User',
        }),
      });

      const json = await res.json();

      if (json.status === 'success' || json.chargeInitiated) {
        // Payment initiated — poll for completion
        pollForCompletion(ref);
      } else if (json.paymentLink) {
        // Redirect to payment link
        await Linking.openURL(json.paymentLink);
        // After user returns, verify
        setTimeout(() => verifyAndActivate(ref), 5000);
      } else {
        throw new Error(json.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('[PaymentScreen] handleConfirm error:', err);
      Alert.alert(
        'Payment Error',
        err.message || 'Could not connect to payment service. Please check your connection.',
        [{ text: 'Try Again', onPress: () => setStep('form') }]
      );
      setLoading(false);
    }
  };

  const pollForCompletion = async (ref, attempts = 0) => {
    if (attempts > 15) {
      Alert.alert(
        'Payment Timeout',
        'We did not receive payment confirmation. If money was deducted, contact support@agrof.farm',
        [{ text: 'OK', onPress: () => setStep('form') }]
      );
      setLoading(false);
      return;
    }

    try {
      const storeBase = apiConfig?.STORE?.API_URL?.replace('/api/store', '') || 'http://localhost:3001';
      const res = await fetch(`${storeBase}/api/payment/verify-subscription?txRef=${ref}`);
      const json = await res.json();

      if (json.status === 'successful') {
        await verifyAndActivate(ref, json);
      } else if (json.status === 'pending') {
        setTimeout(() => pollForCompletion(ref, attempts + 1), 4000);
      } else {
        Alert.alert('Payment Failed', json.message || 'Payment was not successful.', [
          { text: 'Try Again', onPress: () => setStep('form') },
        ]);
        setLoading(false);
      }
    } catch {
      setTimeout(() => pollForCompletion(ref, attempts + 1), 5000);
    }
  };

  const verifyAndActivate = async (ref, verifyData) => {
    const result = await activateSubscription({
      userSub: user.uid,
      paymentRef: ref,
      network,
      amountPaid: verifyData?.amount || PLAN_PRICE_UGX,
      currency: verifyData?.currency || 'UGX',
    });

    if (result.success) {
      await refresh();
      setStep('success');
    } else {
      Alert.alert('Activation Error', 'Payment received but subscription activation failed. Contact support@agrof.farm with ref: ' + ref);
    }
    setLoading(false);
  };

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
        </View>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>You're Premium!</Text>
          <Text style={styles.successText}>
            Your AGRON annual subscription is now active. Enjoy P2P selling, international market access, and advanced AI features!
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'pending') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Processing Payment</Text>
        </View>
        <View style={styles.successContainer}>
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 24 }} />
          <Text style={styles.pendingTitle}>Waiting for approval</Text>
          <Text style={styles.successText}>
            Check your phone for a prompt to approve UGX {PLAN_PRICE_UGX.toLocaleString()} to complete your subscription.
          </Text>
          <Text style={styles.txRefText}>Ref: {txRef}</Text>
        </View>
      </View>
    );
  }

  if (step === 'confirm') {
    const net = NETWORKS.find((n) => n.id === network);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('form')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Payment</Text>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmLabel}>Plan</Text>
            <Text style={styles.confirmValue}>AGRON Annual — $10 / year</Text>

            <View style={styles.divider} />

            <Text style={styles.confirmLabel}>Amount</Text>
            <Text style={styles.confirmValueBig}>UGX {PLAN_PRICE_UGX.toLocaleString()}</Text>

            <View style={styles.divider} />

            <Text style={styles.confirmLabel}>Network</Text>
            <Text style={[styles.confirmValue, { color: net.color }]}>{net.label}</Text>

            <View style={styles.divider} />

            <Text style={styles.confirmLabel}>Phone</Text>
            <Text style={styles.confirmValue}>{formatPhone(phone)}</Text>
          </View>

          <View style={styles.warningBox}>
            <MaterialIcons name="info-outline" size={18} color="#FF9800" />
            <Text style={styles.warningText}>
              You will receive a prompt on your mobile phone to approve this payment.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="lock" size={18} color="white" />
                <Text style={styles.submitBtnText}>Approve & Pay</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.secureNote}>Payments secured by Flutterwave · No card required</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscribe — $10/year</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan card */}
        <View style={styles.planCard}>
          <View style={styles.planBadge}>
            <MaterialIcons name="star" size={20} color="#FF9800" />
            <Text style={styles.planBadgeText}>AGRON Premium</Text>
          </View>
          <Text style={styles.planPrice}>UGX {PLAN_PRICE_UGX.toLocaleString()}</Text>
          <Text style={styles.planPeriod}>per year · ~$10 USD</Text>

          {[
            'Post listings & sell on the P2P market',
            'See & contact international buyers/sellers',
            'Advanced AI crop analysis & recommendations',
            'AI-optimised rotation & budget planning',
          ].map((b) => (
            <View key={b} style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Network selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Network</Text>
          <View style={styles.networkRow}>
            {NETWORKS.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[styles.networkBtn, network === n.id && { borderColor: n.color, backgroundColor: `${n.color}18` }]}
                onPress={() => setNetwork(n.id)}
              >
                <MaterialIcons name={n.icon} size={22} color={network === n.id ? n.color : '#888'} />
                <Text style={[styles.networkBtnText, network === n.id && { color: n.color, fontWeight: '700' }]}>
                  {n.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phone input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mobile Money Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="e.g. 0767 000 000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={15}
          />
          <Text style={styles.hint}>
            {network === 'MTN' ? 'MTN: 076x, 077x, 078x, 039x' : 'Airtel: 070x, 075x'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !phone.replace(/\D/g, '').length && styles.submitBtnDisabled]}
          onPress={handleInitiate}
          disabled={!phone.replace(/\D/g, '').length}
        >
          <MaterialIcons name="payment" size={20} color="white" />
          <Text style={styles.submitBtnText}>Continue to Payment</Text>
        </TouchableOpacity>

        <Text style={styles.secureNote}>Payments secured by Flutterwave · No card required</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2c5530', flex: 1 },
  content: { flex: 1, padding: 16 },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  planBadgeText: { fontSize: 15, fontWeight: '700', color: '#FF9800' },
  planPrice: { fontSize: 28, fontWeight: '800', color: '#2c5530' },
  planPeriod: { fontSize: 13, color: '#888', marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  benefitText: { fontSize: 14, color: '#333', flex: 1 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  networkRow: { flexDirection: 'row', gap: 12 },
  networkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  networkBtnText: { fontSize: 13, color: '#888' },
  phoneInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hint: { fontSize: 12, color: '#999', marginTop: 6, fontStyle: 'italic' },
  submitBtn: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secureNote: { fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  // Confirm step
  confirmCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  confirmLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  confirmValue: { fontSize: 15, color: '#333', fontWeight: '600', marginBottom: 12 },
  confirmValueBig: { fontSize: 24, color: '#2c5530', fontWeight: '800', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 18 },
  // Pending / success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#2c5530', marginTop: 20, marginBottom: 12 },
  pendingTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 12 },
  successText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  txRefText: { fontSize: 12, color: '#aaa', marginBottom: 24 },
  doneBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
  },
  doneBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

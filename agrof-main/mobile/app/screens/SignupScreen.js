import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import authService from '../services/authService';
import { getEmailVerificationMode } from '../config/authConfig';
import { SORTED_COUNTRIES, getDefaultLanguage } from '../config/countryConfig';
import { changeLanguage } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [country, setCountry] = useState('UG');
  const [selectedCountry, setSelectedCountry] = useState(
    SORTED_COUNTRIES.find(c => c.code === 'UG')
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountrySelect = async (item) => {
    setCountry(item.code);
    setSelectedCountry(item);
    setShowCountryPicker(false);
    setCountrySearch('');

    // Auto-switch app language based on country
    const lang = getDefaultLanguage(item.code);
    try {
      await changeLanguage(lang);
      await AsyncStorage.setItem('userCountry', item.code);
    } catch (e) {
      console.log('Language switch failed:', e);
    }
  };

  const filteredCountries = countrySearch.trim()
    ? SORTED_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : SORTED_COUNTRIES;

  const validateForm = () => {
    const { email, phone, password, confirmPassword, fullName } = formData;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      Alert.alert('Error', 'Password must include at least one uppercase letter (A-Z).');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      Alert.alert('Error', 'Password must include at least one lowercase letter (a-z).');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      Alert.alert('Error', 'Password must include at least one number (0-9).');
      return false;
    }
    if (!/[!@#$%^&*()_\-+={}[\]|\\;:'",.<>?/~`]/.test(password)) {
      Alert.alert('Error', 'Password must include at least one special character (e.g. !@#$%).');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await authService.signUpWithEmail(
        formData.email,
        formData.password,
        { fullName: formData.fullName, phone: formData.phone, country }
      );

      if (result.success) {
        const registeredEmail = formData.email.trim().toLowerCase();
        setFormData({ email: '', phone: '', password: '', confirmPassword: '', fullName: '' });

        if (getEmailVerificationMode() === 'code' && navigation.navigate) {
          navigation.navigate('verification', { email: registeredEmail });
          return;
        }

        Alert.alert(
          '📧 Verify Your Email',
          `A verification email has been sent to ${registeredEmail}\n\nPlease check your email and click the verification link, then come back to login.\n\n(Check spam folder if you don't see it!)`,
          [{ text: 'Go to Login', onPress: () => navigation.navigate ? navigation.navigate('login') : navigation.goBack() }],
          { cancelable: false }
        );
      } else {
        Alert.alert('Signup Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e8f5e9' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>

            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Join AGRON — your AI crop health companion</Text>

            <View style={styles.form}>
              {/* Country picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Country</Text>
                <TouchableOpacity style={styles.countryButton} onPress={() => setShowCountryPicker(true)}>
                  <Text style={styles.countryFlag}>{selectedCountry?.flag || '🌍'}</Text>
                  <Text style={styles.countryName}>{selectedCountry?.name || 'Select country'}</Text>
                  <Text style={styles.countryChevron}>▼</Text>
                </TouchableOpacity>
                <Text style={styles.countryHint}>
                  AI will use crop &amp; disease data specific to your country
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#999"
                  value={formData.fullName}
                  onChangeText={(v) => updateField('fullName', v)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(v) => updateField('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your phone number"
                  placeholderTextColor="#999"
                  value={formData.phone}
                  onChangeText={(v) => updateField('phone', v)}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={(v) => updateField('password', v)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999"
                    value={formData.confirmPassword}
                    onChangeText={(v) => updateField('confirmPassword', v)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate ? navigation.navigate('login') : navigation.goBack()}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack && navigation.goBack()}>
                <Text style={styles.backButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search country…"
              placeholderTextColor="#999"
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, item.code === country && styles.countryItemSelected]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <View style={styles.countryItemText}>
                    <Text style={styles.countryItemName}>{item.name}</Text>
                    <Text style={styles.countryItemCurrency}>{item.currency}</Text>
                  </View>
                  {item.code === country && <Text style={styles.countryItemCheck}>✓</Text>}
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20, minHeight: height },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
    maxWidth: 400, alignSelf: 'center', width: '100%',
  },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoImage: { width: 100, height: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 15, fontSize: 16, backgroundColor: '#fafafa', color: '#333',
  },
  countryButton: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 15, backgroundColor: '#fafafa',
  },
  countryFlag: { fontSize: 22, marginRight: 10 },
  countryName: { flex: 1, fontSize: 16, color: '#333' },
  countryChevron: { fontSize: 12, color: '#999' },
  countryHint: { fontSize: 11, color: '#999', marginTop: 4 },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, backgroundColor: '#fafafa',
  },
  passwordInput: { flex: 1, padding: 15, fontSize: 16, color: '#333' },
  eyeButton: { padding: 15 },
  eyeText: { fontSize: 18 },
  termsText: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  termsLink: { color: '#4CAF50', fontWeight: '600' },
  signupButton: {
    backgroundColor: '#4CAF50', borderRadius: 12, padding: 18, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginBottom: 20,
  },
  signupButtonDisabled: { opacity: 0.7 },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginText: { color: '#666', fontSize: 16 },
  loginLink: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold' },
  backButton: { alignItems: 'center', paddingVertical: 10 },
  backButtonText: { color: '#666', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalClose: { fontSize: 20, color: '#999', padding: 4 },
  searchInput: {
    margin: 12, borderWidth: 1.5, borderColor: '#e0e0e0',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#333', backgroundColor: '#fafafa',
  },
  countryItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5',
  },
  countryItemSelected: { backgroundColor: '#f0faf0' },
  countryItemFlag: { fontSize: 22, marginRight: 14 },
  countryItemText: { flex: 1 },
  countryItemName: { fontSize: 15, color: '#333', fontWeight: '500' },
  countryItemCurrency: { fontSize: 12, color: '#999', marginTop: 2 },
  countryItemCheck: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold' },
});

export default SignupScreen;

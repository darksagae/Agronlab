import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import authService from '../services/authService';
import { getEmailVerificationMode } from '../config/authConfig';

const EmailVerificationScreen = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const mode = getEmailVerificationMode();
  const isCodeMode = mode === 'code';

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [code, setCode] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkVerificationStatus = async () => {
    if (isCodeMode) {
      await handleConfirmCode();
      return;
    }
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user?.emailVerified) {
        setVerificationStatus('verified');
        Alert.alert(
          'Email Verified!',
          'Your account is activated.',
          [{ text: 'Continue', onPress: () => navigation.goBack?.() }]
        );
      } else {
        Alert.alert(
          'Not verified yet',
          'Open the link in your email, then tap check again.'
        );
      }
    } catch (error) {
      console.error('Verification check error:', error);
    }
  };

  const handleConfirmCode = async () => {
    const trimmed = code.replace(/\s/g, '');
    if (!email) {
      Alert.alert('Missing email', 'Go back to sign up and try again.');
      return;
    }
    if (!/^\d{4,8}$/.test(trimmed)) {
      Alert.alert('Invalid code', 'Enter the verification code from your email (digits only).');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.confirmSignUpWithCode(email, trimmed);
      if (result.success) {
        setVerificationStatus('verified');
        Alert.alert('Verified', 'Your email is confirmed. You can sign in now.', [
          { text: 'Sign in', onPress: () => navigation.navigate?.('login') },
        ]);
      } else {
        Alert.alert('Verification failed', result.error || 'Invalid code');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not verify');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    if (!email) {
      Alert.alert('Email required', 'Use Sign up again with your email.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resendVerificationEmail(email);
      if (result.success) {
        Alert.alert(
          'Sent',
          isCodeMode
            ? 'A new verification code was sent to your email.'
            : 'Verification email sent. Check your inbox.'
        );
        setResendCooldown(60);
      } else {
        Alert.alert('Error', result.error || 'Failed to send');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    const emailAppUrl = Platform.OS === 'ios' ? 'message://' : 'mailto:';
    Linking.canOpenURL(emailAppUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailAppUrl);
        }
        Alert.alert('Error', 'Cannot open email app');
      })
      .catch((err) => console.error(err));
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{isCodeMode ? '✉️' : '📧'}</Text>
          </View>
        </View>

        <Text style={styles.title}>
          {isCodeMode ? 'Enter verification code' : 'Check your email'}
        </Text>
        <Text style={styles.subtitle}>
          {isCodeMode
            ? 'We sent a code to:'
            : 'We sent a verification link to:'}
        </Text>
        <Text style={styles.emailText}>{email || 'your email address'}</Text>

        {isCodeMode ? (
          <View style={styles.codeBlock}>
            <Text style={styles.label}>Verification code</Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={8}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Enter the code from the email Amazon Cognito / SES sent (usually 6 digits).
            </Text>
          </View>
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>What to do next:</Text>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>Check inbox and spam folder</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>Click the verification link</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>Return here and confirm</Text>
            </View>
          </View>
        )}

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              verificationStatus === 'verified' ? styles.statusVerified : styles.statusPending,
            ]}
          />
          <Text style={styles.statusText}>
            {verificationStatus === 'verified' ? 'Verified' : 'Pending'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={checkVerificationStatus}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isCodeMode ? 'Verify account' : "I've verified my email"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenEmailApp}>
            <Text style={styles.secondaryButtonText}>Open email app</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, resendCooldown > 0 && styles.resendButtonDisabled]}
            onPress={handleResendVerification}
            disabled={loading || resendCooldown > 0}
          >
            <Text style={styles.resendButtonText}>
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : isCodeMode
                  ? 'Resend code'
                  : 'Resend email'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate?.('login')}>
          <Text style={styles.backButtonText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#2c5530',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  codeBlock: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#fafafa',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    lineHeight: 18,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusPending: {
    backgroundColor: '#ffc107',
  },
  statusVerified: {
    backgroundColor: '#28a745',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2c5530',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2c5530',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#2c5530',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#2c5530',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default EmailVerificationScreen;

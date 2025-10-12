import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import firebaseService from '../services/firebaseService';

const { width, height } = Dimensions.get('window');

const EmailVerificationScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    // Start cooldown timer
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev > 0) {
          return prev - 1;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const result = await firebaseService.checkEmailVerification();
      if (result.success && result.verified) {
        setVerificationStatus('verified');
        Alert.alert(
          'Email Verified!',
          'Your account is now fully activated. You can access all premium features.',
          [{ text: 'Continue', onPress: () => navigation.navigate('MainApp') }]
        );
      }
    } catch (error) {
      console.error('Verification check error:', error);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const result = await firebaseService.resendVerificationEmail();
      if (result.success) {
        Alert.alert('Success', 'Verification email sent!');
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification email');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    const emailAppUrl = Platform.OS === 'ios' 
      ? 'message://' 
      : 'mailto:';
    
    Linking.canOpenURL(emailAppUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(emailAppUrl);
        } else {
          Alert.alert('Error', 'Cannot open email app');
        }
      })
      .catch(err => console.error('Error opening email app:', err));
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Skip Verification?',
      'You can still use free features, but premium features (Store, Blocker, Account) will require email verification.',
      [
        { text: 'Stay Here', style: 'cancel' },
        { 
          text: 'Skip for Now', 
          onPress: () => navigation.navigate('MainApp'),
          style: 'default'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>📧</Text>
          </View>
        </View>

        {/* Header */}
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to:
        </Text>
        <Text style={styles.emailText}>{email || 'your email address'}</Text>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>What to do next:</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>Check your email inbox (and spam folder)</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>Click the verification link</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>Return to the app and tap "I've Verified"</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, 
            verificationStatus === 'verified' ? styles.statusVerified : styles.statusPending
          ]} />
          <Text style={styles.statusText}>
            {verificationStatus === 'verified' ? 'Email Verified!' : 'Verification Pending'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Check Verification */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={checkVerificationStatus}
          >
            <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
          </TouchableOpacity>

          {/* Open Email App */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenEmailApp}
          >
            <Text style={styles.secondaryButtonText}>Open Email App</Text>
          </TouchableOpacity>

          {/* Resend Email */}
          <TouchableOpacity
            style={[
              styles.resendButton,
              resendCooldown > 0 && styles.resendButtonDisabled
            ]}
            onPress={handleResendVerification}
            disabled={loading || resendCooldown > 0}
          >
            {loading ? (
              <ActivityIndicator color="#FFD700" size="small" />
            ) : (
              <Text style={styles.resendButtonText}>
                {resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : 'Resend Verification Email'
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipForNow}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
    marginRight: 15,
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
    marginBottom: 30,
    padding: 15,
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
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: '#FFD700',
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
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default EmailVerificationScreen;

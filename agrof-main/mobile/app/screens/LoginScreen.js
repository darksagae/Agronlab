import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import authService from '../services/authService';
import { getEmailVerificationMode } from '../config/authConfig';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { refreshUserData } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const scrollViewRef = useRef(null);

  // Scroll to top when screen is shown
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);
      const result = await authService.signInWithEmail(email, password);
      
      console.log('🔐 Login result:', {
        success: result.success,
        hasUser: !!result.user,
        userEmail: result.user?.email,
        userPhone: result.user?.phone,
        userFullName: result.user?.fullName,
        userUsername: result.user?.username,
        profilePhoto: result.user?.profilePhoto ? 'YES' : 'NO'
      });
      
      if (result.success) {
        console.log('✅ Login successful - navigating back to app');
        console.log('👤 User data loaded:', result.user);
        
        // TRIGGER: Refresh user data in UserContext so it's available everywhere
        console.log('🔄 Triggering global user data refresh for blocker & profile...');
        await refreshUserData();
        console.log('✅ Global user data refreshed - available in all components!');
        
        // Also trigger App.js authentication state update
        if (navigation.onAuthSuccess) {
          console.log('🔄 Triggering App.js auth state update...');
          await navigation.onAuthSuccess();
        }
        
        // Navigate back to app immediately - user is logged in!
        if (navigation.goBack) {
          navigation.goBack();
        }
      } else {
        console.error('❌ Login failed:', result.error);
        
        // Check if this is an email verification issue
        if (result.needsVerification) {
          const isCode = getEmailVerificationMode() === 'code';
          Alert.alert(
            'Email Not Verified',
            result.error +
              (isCode
                ? '\n\nYou can enter the code from your email or request a new one.'
                : '\n\nWould you like us to resend the verification email?'),
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: async () => {
                  await authService.signOut();
                },
              },
              ...(isCode && navigation.navigate
                ? [
                    {
                      text: 'Enter code',
                      onPress: async () => {
                        await authService.signOut();
                        navigation.navigate('verification', {
                          email: result.userEmail || email,
                        });
                      },
                    },
                  ]
                : []),
              {
                text: isCode ? 'Resend code' : 'Resend Email',
                onPress: async () => {
                  try {
                    const resendResult = await authService.resendVerificationEmail(
                      result.userEmail || email
                    );
                    if (resendResult.success) {
                      Alert.alert(
                        'Success',
                        isCode
                          ? 'A new verification code was sent. Check your email.'
                          : 'Verification email sent! Please check your inbox, then try logging in again.'
                      );
                      await authService.signOut();
                    } else {
                      Alert.alert(
                        'Error',
                        resendResult.error || 'Failed to resend verification'
                      );
                      await authService.signOut();
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to resend verification');
                    await authService.signOut();
                  }
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          Alert.alert('Login Failed', result.error);
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    try {
      const result = await authService.sendPasswordResetEmail(email);
      if (result.success) {
        Alert.alert(
          'Password Reset Sent',
          result.message ||
            'Check your email for reset instructions (link or code depending on your account).'
        );
      } else {
        Alert.alert('Error', result.error || 'Could not send reset email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e8f5e9' }}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your AGROF account</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Back to Home */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9', // Light green background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
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
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 15,
  },
  eyeText: {
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    color: '#666',
    fontSize: 16,
  },
  signupLink: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
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

export default LoginScreen;

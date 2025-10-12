import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import authService from '../services/authService';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

const AuthGate = ({ 
  children, 
  tabName = 'Premium', 
  onAuthSuccess,
  navigation,
  showSoftGate = true,
  softGateAttempts = 2 
}) => {
  // Use global UserContext instead of separate auth check
  const { user, isAuthenticated, isLoading } = useUser();
  
  const [attemptCount, setAttemptCount] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);

  console.log('🔒 AuthGate: Checking access for', tabName);
  console.log('   - Authenticated:', isAuthenticated);
  console.log('   - Has User:', !!user);
  console.log('   - User Email:', user?.email);

  // On first render, trigger the gate check
  useEffect(() => {
    if (!isAuthenticated) {
      handleTabAccess();
    }
  }, []);

  const handleTabAccess = () => {
    if (isAuthenticated) {
      return; // User is authenticated, show content
    }

    // Increment attempt count
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    if (showSoftGate && newAttemptCount <= softGateAttempts) {
      // Show soft gate (friendly reminder)
      setShowSoftPrompt(true);
    } else {
      // Show hard gate (authentication required)
      setShowAuthPrompt(true);
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    console.log('⏳ AuthGate: Loading authentication state...');
    return <>{children}</>; // Show content while loading to avoid flashing
  }

  // If authenticated, show content
  if (isAuthenticated && user) {
    console.log('✅ AuthGate: User authenticated - showing content');
    return <>{children}</>;
  }
  
  console.log('🔒 AuthGate: User not authenticated - showing login prompt');

  return (
    <View style={styles.container}>
      {/* Blurred Background - just blur, no text */}
      <View style={styles.blurredContent} />

      {/* Floating Premium Card */}
      <View style={styles.floatingPrompt}>
        <View style={styles.promptCard}>
          <MaterialIcons name="stars" size={50} color="#4CAF50" />
          <Text style={styles.promptTitle}>Premium Features</Text>
          <Text style={styles.promptMessage}>
            Sign in to access {tabName} and manage your profile
          </Text>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('login');
              }
            }}
          >
            <Text style={styles.signupButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Create Account Link */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('signup');
              }
            }}
          >
            <Text style={styles.loginButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurredContent: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  lockOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 30,
  },
  floatingPrompt: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  promptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glass effect - semi-transparent white
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Frosted border
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  promptMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  unlockButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  softGateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  softGateTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  softGateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  attemptsText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 25,
  },
  tryPremiumButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tryPremiumButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  maybeLaterButton: {
    paddingVertical: 12,
  },
  maybeLaterButtonText: {
    color: '#666',
    fontSize: 16,
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  authMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  signupButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 12,
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 14,
  },
});

export default AuthGate;

/**
 * BuyerSellerBlocker - Real User Data Display
 * 
 * This component demonstrates how to access real user data (fetched from Firebase/Supabase)
 * in buyer/seller components. The data persists across devices and app restarts.
 * 
 * Usage:
 *   import { useUser } from '../contexts/UserContext';
 *   const { user, isAuthenticated } = useUser();
 * 
 * Available user data:
 *   - user.fullName (from signup)
 *   - user.email (from Firebase Auth)
 *   - user.phone (from signup)
 *   - user.profilePhoto (uploaded by user)
 *   - user.username (display name)
 *   - user.uid (Firebase UID)
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';

const BuyerSellerBlocker = ({ type = 'buyer' }) => {
  const { user, isAuthenticated, isLoading } = useUser();

  console.log('🛒 BuyerSellerBlocker: Rendering', type);
  console.log('   - Authenticated:', isAuthenticated);
  console.log('   - User data:', user ? 'Available' : 'Not available');
  if (user) {
    console.log('   - Full Name:', user.fullName);
    console.log('   - Email:', user.email);
    console.log('   - Phone:', user.phone);
    console.log('   - Profile Photo:', user.profilePhoto ? 'YES' : 'NO');
    console.log('   - UID:', user.uid);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading {type} profile...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="person-off" size={60} color="#ccc" />
        <Text style={styles.noDataText}>Please sign in to continue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {/* Profile Photo - From Supabase or Base64 */}
        <View style={styles.photoContainer}>
          {user.profilePhoto ? (
            <Image
              source={{ uri: user.profilePhoto }}
              style={styles.profilePhoto}
              onError={(error) => {
                console.log('⚠️ BuyerSellerBlocker: Failed to load profile photo:', error);
              }}
              onLoad={() => {
                console.log('✅ BuyerSellerBlocker: Profile photo loaded successfully');
              }}
            />
          ) : (
            <View>
              <MaterialIcons name="account-circle" size={100} color="#4CAF50" />
              <Text style={styles.noPhotoText}>No photo</Text>
            </View>
          )}
        </View>

        {/* User Information - Fetched from Firebase/Supabase */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.fullName || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>@{user.username || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user.phone || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="fingerprint" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValueSmall}>{user.uid}</Text>
            </View>
          </View>
        </View>

        {/* Badge */}
        <View style={styles.badgeContainer}>
          <MaterialIcons 
            name={type === 'buyer' ? 'shopping-cart' : 'store'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.badgeText}>
            {type === 'buyer' ? 'BUYER' : 'SELLER'}
          </Text>
        </View>

        {/* Persistence Info */}
        <View style={styles.persistenceInfo}>
          <MaterialIcons name="cloud-done" size={16} color="#4CAF50" />
          <Text style={styles.persistenceText}>
            Data synced from Supabase & Firebase
          </Text>
        </View>
        <View style={styles.persistenceInfo}>
          <MaterialIcons name="devices" size={16} color="#2196F3" />
          <Text style={styles.persistenceText}>
            Available across all devices
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  badgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  persistenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  persistenceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  noPhotoText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default BuyerSellerBlocker;

 * 
 * This component demonstrates how to access real user data (fetched from Firebase/Supabase)
 * in buyer/seller components. The data persists across devices and app restarts.
 * 
 * Usage:
 *   import { useUser } from '../contexts/UserContext';
 *   const { user, isAuthenticated } = useUser();
 * 
 * Available user data:
 *   - user.fullName (from signup)
 *   - user.email (from Firebase Auth)
 *   - user.phone (from signup)
 *   - user.profilePhoto (uploaded by user)
 *   - user.username (display name)
 *   - user.uid (Firebase UID)
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';

const BuyerSellerBlocker = ({ type = 'buyer' }) => {
  const { user, isAuthenticated, isLoading } = useUser();

  console.log('🛒 BuyerSellerBlocker: Rendering', type);
  console.log('   - Authenticated:', isAuthenticated);
  console.log('   - User data:', user ? 'Available' : 'Not available');
  if (user) {
    console.log('   - Full Name:', user.fullName);
    console.log('   - Email:', user.email);
    console.log('   - Phone:', user.phone);
    console.log('   - Profile Photo:', user.profilePhoto ? 'YES' : 'NO');
    console.log('   - UID:', user.uid);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading {type} profile...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="person-off" size={60} color="#ccc" />
        <Text style={styles.noDataText}>Please sign in to continue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {/* Profile Photo - From Supabase or Base64 */}
        <View style={styles.photoContainer}>
          {user.profilePhoto ? (
            <Image
              source={{ uri: user.profilePhoto }}
              style={styles.profilePhoto}
              onError={(error) => {
                console.log('⚠️ BuyerSellerBlocker: Failed to load profile photo:', error);
              }}
              onLoad={() => {
                console.log('✅ BuyerSellerBlocker: Profile photo loaded successfully');
              }}
            />
          ) : (
            <View>
              <MaterialIcons name="account-circle" size={100} color="#4CAF50" />
              <Text style={styles.noPhotoText}>No photo</Text>
            </View>
          )}
        </View>

        {/* User Information - Fetched from Firebase/Supabase */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.fullName || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>@{user.username || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user.phone || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="fingerprint" size={20} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValueSmall}>{user.uid}</Text>
            </View>
          </View>
        </View>

        {/* Badge */}
        <View style={styles.badgeContainer}>
          <MaterialIcons 
            name={type === 'buyer' ? 'shopping-cart' : 'store'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.badgeText}>
            {type === 'buyer' ? 'BUYER' : 'SELLER'}
          </Text>
        </View>

        {/* Persistence Info */}
        <View style={styles.persistenceInfo}>
          <MaterialIcons name="cloud-done" size={16} color="#4CAF50" />
          <Text style={styles.persistenceText}>
            Data synced from Supabase & Firebase
          </Text>
        </View>
        <View style={styles.persistenceInfo}>
          <MaterialIcons name="devices" size={16} color="#2196F3" />
          <Text style={styles.persistenceText}>
            Available across all devices
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  badgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  persistenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  persistenceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  noPhotoText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default BuyerSellerBlocker;
















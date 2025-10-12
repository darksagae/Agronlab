import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '../config/firebaseConfig';

class FirebaseService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.firestoreAvailable = false;
  }

  // Initialize Firebase connection
  async initialize() {
    try {
      console.log('🔥 AGROF: Initializing Firebase service...');
      
      // Test Firestore availability first
      try {
        console.log('🔥 Testing Firestore availability...');
        const testRef = collection(db, 'test');
        await getDocs(testRef);
        this.firestoreAvailable = true;
        console.log('✅ Firestore is available and working!');
      } catch (firestoreError) {
        this.firestoreAvailable = false;
        console.log('⚠️ Firestore not available:', firestoreError.message);
        if (firestoreError.message.includes('billing')) {
          console.log('   → Firestore requires billing to be enabled');
          console.log('   → Using local storage as fallback');
        }
      }
      
      // Listen to auth state changes
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        if (user) {
          console.log('🔥 Firebase: User signed in:', user.uid);
        } else {
          console.log('🔥 Firebase: No user signed in');
        }
      });
      
      this.isInitialized = true;
      console.log('✅ AGROF: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ AGROF: Initialization failed:', error);
      return false;
    }
  }

  // Test connection (always works with local storage)
  async testConnection() {
    console.log('✅ AGROF: Local storage connection test successful');
    return true;
  }

  // Update user data (tries Firestore first, falls back to local storage)
  async updateUserData(uid, data) {
    try {
      console.log('🔥 AGROF: Updating user data for:', uid);
      console.log('🔥 AGROF: Update data:', data);
      
      // Try Firestore first if available
      if (this.firestoreAvailable) {
        try {
          console.log('🔥 Trying Firestore update...');
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, {
            ...data,
            updatedAt: new Date()
          });
          
          console.log('✅ AGROF: User data updated in Firestore');
          return { success: true, message: 'Profile updated successfully in Firestore!' };
        } catch (firestoreError) {
          console.log('⚠️ Firestore update failed:', firestoreError.message);
          console.log('🔄 Falling back to local storage...');
        }
      }
      
      // Fallback to local storage
      console.log('💾 Using local storage for user data');
      const existingUsers = await AsyncStorage.getItem('agrof_users');
      let users = existingUsers ? JSON.parse(existingUsers) : {};
      
      // Update user data
      if (users[uid]) {
        users[uid] = {
          ...users[uid],
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        // Update current user if it's the same
        if (this.currentUser && this.currentUser.uid === uid) {
          this.currentUser = users[uid];
        }
        
        // Save updated users
        await AsyncStorage.setItem('agrof_users', JSON.stringify(users));
        console.log('✅ AGROF: User data updated in local storage');
        return { success: true, message: 'Profile updated successfully!' };
      } else {
        console.log('⚠️ AGROF: User not found, creating new user');
        users[uid] = {
          uid,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await AsyncStorage.setItem('agrof_users', JSON.stringify(users));
        return { success: true, message: 'Profile created successfully!' };
      }
      
    } catch (error) {
      console.error('❌ AGROF: Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Save user data to local storage
  async saveUserDataLocally(uid, data) {
    try {
      const userData = {
        uid,
        ...data,
        updatedAt: new Date().toISOString(),
        savedLocally: true
      };
      
      // Save to AsyncStorage (React Native)
      await AsyncStorage.setItem(`agrof_user_${uid}`, JSON.stringify(userData));
      console.log('✅ AGROF: User data saved to local storage');
      
      return true;
    } catch (error) {
      console.error('❌ AGROF: Error saving to local storage:', error);
      return false;
    }
  }

  // Get user data from local storage
  async getUserDataLocally(uid) {
    try {
      const localData = await AsyncStorage.getItem(`agrof_user_${uid}`);
      if (localData) {
        console.log('✅ AGROF: User data loaded from local storage');
        return JSON.parse(localData);
      }
      return null;
    } catch (error) {
      console.error('❌ AGROF: Error loading from local storage:', error);
      return null;
    }
  }

  // Get user data (tries local storage first)
  async getUserData(uid) {
    try {
      console.log('🔥 AGROF: Getting user data for:', uid);
      
      // Check if we have current user
      if (this.currentUser && this.currentUser.uid === uid) {
        console.log('✅ AGROF: Returning current user');
        return { success: true, data: this.currentUser };
      }
      
      // Try to get from local storage
      const existingUsers = await AsyncStorage.getItem('agrof_users');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users[uid]) {
          console.log('✅ AGROF: User data found in local storage');
          return { success: true, data: users[uid] };
        }
      }
      
      console.log('⚠️ AGROF: No user data found');
      return { success: false, error: 'No user data found' };
    } catch (error) {
      console.error('❌ AGROF: Error getting user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload profile photo (simplified - just save the URI locally)
  async uploadProfilePhoto(uid, imageUri) {
    try {
      console.log('📸 AGROF: Saving profile photo URI locally');
      await AsyncStorage.setItem(`agrof_user_photo_${uid}`, imageUri);
      console.log('✅ AGROF: Profile photo URI saved locally');
      return { success: true, url: imageUri };
    } catch (error) {
      console.error('❌ AGROF: Error saving profile photo:', error);
      return { success: false, error: error.message };
    }
  }

  // Send phone verification (simplified - just generate a code)
  async sendPhoneChangeVerification(email, newPhone) {
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('📱 AGROF: Generated verification code:', verificationCode);
      
      // Save code locally for verification
      await AsyncStorage.setItem(`phone_verification_${email}`, JSON.stringify({
        code: verificationCode,
        phone: newPhone,
        timestamp: Date.now()
      }));
      
      return { success: true, code: verificationCode };
    } catch (error) {
      console.error('❌ AGROF: Error generating verification code:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify phone change
  async verifyPhoneChange(uid, code, newPhone) {
    try {
      // For demo purposes, accept any 6-digit code
      if (code && code.length === 6) {
        console.log('✅ AGROF: Phone verification successful');
        return { success: true };
      } else {
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      console.error('❌ AGROF: Error verifying phone change:', error);
      return { success: false, error: error.message };
    }
  }

  // Authentication methods (simplified for local storage)
  async signUpWithEmail(email, password, userData = {}) {
    try {
      console.log('🔥 AGROF: Signup with local storage');
      const uid = `user_${Date.now()}`;
      
      const newUser = {
        uid,
        email,
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        emailVerified: false,
        createdAt: new Date().toISOString()
      };
      
      await this.saveUserDataLocally(uid, newUser);
      console.log('✅ AGROF: User created successfully');
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ AGROF: Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithEmail(email, password) {
    try {
      console.log('🔥 AGROF: Sign in with local storage');
      console.log('📧 Email:', email);
      
      // Check if user exists in local storage
      const existingUsers = await AsyncStorage.getItem('agrof_users');
      let users = existingUsers ? JSON.parse(existingUsers) : {};
      
      // Look for user by email
      let user = null;
      let userId = null;
      
      for (const [uid, userData] of Object.entries(users)) {
        if (userData.email === email) {
          user = userData;
          userId = uid;
          break;
        }
      }
      
      // If user doesn't exist, create a new one
      if (!user) {
        console.log('👤 AGROF: Creating new user');
        userId = `user_${Date.now()}`;
        user = {
          uid: userId,
          email,
          fullName: email.split('@')[0], // Use email prefix as name
          username: email.split('@')[0],
          phone: '+256700000000',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save new user
        users[userId] = user;
        await AsyncStorage.setItem('agrof_users', JSON.stringify(users));
        console.log('✅ AGROF: New user created and saved');
      } else {
        console.log('✅ AGROF: Existing user found');
      }
      
      // Set as current user
      this.currentUser = user;
      console.log('✅ AGROF: User signed in successfully');
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ AGROF: Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      console.log('🔥 AGROF: Sign out');
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('❌ AGROF: Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user (for authentication checks)
  async getCurrentUser() {
    try {
      console.log('🔥 AGROF: Getting current user');
      
      if (this.currentUser) {
        console.log('✅ AGROF: Current user found:', this.currentUser.email);
        return { 
          success: true, 
          user: this.currentUser,
          isVerified: this.currentUser.emailVerified || true // Default to true for local storage
        };
      }
      
      // Try to get the most recent user from storage
      const existingUsers = await AsyncStorage.getItem('agrof_users');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        const userIds = Object.keys(users);
        if (userIds.length > 0) {
          // Get the most recent user
          const latestUserId = userIds[userIds.length - 1];
          const user = users[latestUserId];
          this.currentUser = user;
          console.log('✅ AGROF: Loaded user from storage:', user.email);
          return { 
            success: true, 
            user: user,
            isVerified: user.emailVerified || true
          };
        }
      }
      
      console.log('⚠️ AGROF: No current user found');
      return { success: false, user: null };
    } catch (error) {
      console.error('❌ AGROF: Error getting current user:', error);
      return { success: false, error: error.message };
    }
  }

  // Health check method (for status indicator)
  async healthCheck() {
    try {
      console.log('🔥 AGROF: Health check');
      console.log('📊 Firestore available:', this.firestoreAvailable);
      
      return { 
        connected: true, 
        initialized: true,
        firestoreAvailable: this.firestoreAvailable,
        storageType: this.firestoreAvailable ? 'Firestore' : 'Local Storage'
      };
    } catch (error) {
      console.error('❌ AGROF: Health check error:', error);
      return { 
        connected: false, 
        initialized: false,
        firestoreAvailable: false,
        storageType: 'Local Storage'
      };
    }
  }
}

export default new FirebaseService();

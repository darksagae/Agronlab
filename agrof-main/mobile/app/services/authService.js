import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import supabaseService from './supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.authStateListener = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes session timeout
    this.lastActiveTime = null;
  }
  
  // Check if session has expired
  async isSessionValid() {
    try {
      const lastActive = await AsyncStorage.getItem('agrof_last_active');
      if (!lastActive) return false;
      
      const now = Date.now();
      const timeSinceActive = now - parseInt(lastActive);
      
      console.log('⏰ Session check:', {
        lastActive: new Date(parseInt(lastActive)).toLocaleString(),
        timeSinceActive: Math.round(timeSinceActive / 1000 / 60), // minutes
        sessionTimeout: this.sessionTimeout / 1000 / 60 // minutes
      });
      
      if (timeSinceActive > this.sessionTimeout) {
        console.log('⚠️ Session expired - requiring sign in');
        return false;
      }
      
      console.log('✅ Session still valid');
      return true;
    } catch (error) {
      console.error('❌ Error checking session:', error);
      return false;
    }
  }
  
  // Update last active time
  async updateLastActive() {
    try {
      await AsyncStorage.setItem('agrof_last_active', Date.now().toString());
      this.lastActiveTime = Date.now();
    } catch (error) {
      console.error('❌ Error updating last active:', error);
    }
  }
  
  // Clear session
  async clearSession() {
    try {
      await AsyncStorage.removeItem('agrof_last_active');
      this.lastActiveTime = null;
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }

  // Initialize the service
  async initialize() {
    try {
      console.log('🔥🟢 AGROF: Initializing Firebase Auth + Supabase service...');
      
      // Initialize Supabase first
      const supabaseSuccess = await supabaseService.initialize();
      if (!supabaseSuccess) {
        console.log('⚠️ Supabase initialization failed, continuing with Firebase Auth + Local Storage');
      }
      
      // Wait for Firebase Auth to determine auth state
      console.log('🔥 Waiting for Firebase Auth state...');
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('🔥 Firebase Auth state determined:', user ? user.uid : 'No user');
          
          if (user) {
            await user.reload();
            console.log('🔄 User reloaded - Email verified:', user.emailVerified);
            
            const sessionValid = await this.isSessionValid();
            
            if (!sessionValid) {
              console.log('⏰ Session expired - signing out');
              await signOut(auth);
              this.currentUser = null;
              await this.clearSession();
            } else {
              this.currentUser = user;
              console.log('👤 User signed in:', {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified
              });
              
              await this.updateLastActive();
              await this.loadUserDataFromSupabase(user.uid);
            }
          } else {
            console.log('👤 No user signed in');
            this.currentUser = null;
          }
          
          this.authStateListener = onAuthStateChanged(auth, async (updatedUser) => {
            console.log('🔥 Firebase Auth state changed:', updatedUser ? updatedUser.uid : 'No user');
            this.currentUser = updatedUser;
            
            if (updatedUser) {
              await this.loadUserDataFromSupabase(updatedUser.uid);
            }
          });
          
          unsubscribe();
          resolve();
        });
      });
      
      this.isInitialized = true;
      console.log('✅ AGROF: Firebase Auth + Supabase service initialized');
      return true;
    } catch (error) {
      console.error('❌ AGROF: Service initialization failed:', error);
      return false;
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email, password, userData = {}) {
    try {
      console.log('🔥 AGROF: Signing up with Firebase Auth');
      console.log('📧 Email:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await sendEmailVerification(user);
      console.log('✅ Email verification sent');
      
      await updateProfile(user, {
        displayName: userData.fullName || userData.username || email.split('@')[0],
        photoURL: null
      });
      
      const completeUserData = {
        uid: user.uid,
        email: user.email,
        fullName: userData.fullName || email.split('@')[0],
        username: userData.username || userData.fullName || email.split('@')[0],
        phone: userData.phone || '',
        emailVerified: user.emailVerified,
        profilePhoto: null,
        agrofBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        firebaseAuth: true,
        contactInfo: {
          email: user.email,
          phone: userData.phone || '',
          fullName: userData.fullName || email.split('@')[0]
        }
      };
      
      console.log('🟢 Saving user data to Supabase...');
      const saveResult = await supabaseService.saveUserData(user.uid, completeUserData);
      
      if (saveResult.success) {
        console.log('✅ User data saved successfully!');
      } else {
        console.error('❌ Failed to save user data:', saveResult.error);
      }
      
      console.log('🔒 Signing out user until email verification');
      await signOut(auth);
      
      console.log('✅ AGROF: Signup complete');
      return { 
        success: true, 
        user: completeUserData,
        needsEmailVerification: true
      };
    } catch (error) {
      console.error('❌ AGROF: Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      console.log('🔥 AGROF: Signing in with Firebase Auth');
      console.log('📧 Email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let user = userCredential.user;
      
      console.log('✅ Firebase Auth sign in successful');
      
      await user.reload();
      console.log('📧 Email verified status:', user.emailVerified);
      
      if (!user.emailVerified) {
        console.log('❌ Email not verified');
        return { 
          success: false, 
          error: '📧 Email Not Verified\n\nPlease check your email and click the verification link before logging in.\n\nCheck your spam folder if you don\'t see it!',
          needsVerification: true,
          userEmail: user.email
        };
      }
      
      console.log('✅ Email verified - proceeding with login');
      
      console.log('🟢 Loading user data from Supabase...');
      const userDataResult = await supabaseService.getUserData(user.uid);
      
      let userData;
      if (userDataResult.success) {
        userData = userDataResult.data;
        console.log('✅ User data loaded');
      } else {
        console.log('⚠️ User data not found, creating basic profile');
        userData = {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || email.split('@')[0],
          username: user.displayName || email.split('@')[0],
          phone: '',
          emailVerified: user.emailVerified,
          profilePhoto: null,
          agrofBalance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firebaseAuth: true,
          contactInfo: {
            email: user.email,
            phone: '',
            fullName: user.displayName || email.split('@')[0]
          }
        };
        
        await supabaseService.saveUserData(user.uid, userData);
        console.log('✅ Basic profile saved');
      }
      
      await this.updateLastActive();
      
      console.log('✅ AGROF: User signed in successfully');
      return { 
        success: true, 
        user: userData,
        firebaseUser: user
      };
    } catch (error) {
      console.error('❌ AGROF: Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Resend verification email
  async resendVerificationEmail(email, password = null) {
    try {
      console.log('📧 Resending verification email to:', email);
      
      let user = auth.currentUser;
      
      if (!user) {
        return { 
          success: false, 
          error: 'Session expired. Please try logging in again to resend the verification email.' 
        };
      }
      
      if (user.emailVerified) {
        return { 
          success: false, 
          error: 'Email is already verified! You can now log in.' 
        };
      }
      
      await sendEmailVerification(user);
      console.log('✅ Verification email sent');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error resending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      console.log('🔥 AGROF: Signing out from Firebase Auth');
      await signOut(auth);
      this.currentUser = null;
      
      console.log('🧹 Clearing cached user data...');
      await AsyncStorage.removeItem('agrof_users');
      await AsyncStorage.removeItem('firebase_auth_token');
      await AsyncStorage.removeItem('firebase_uid');
      
      console.log('✅ AGROF: User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ AGROF: Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      console.log('🔥🟢 AGROF: Getting current user');
      
      if (this.currentUser) {
        console.log('✅ Current Firebase user found:', this.currentUser.uid);
        
        await this.currentUser.reload();
        
        const userDataResult = await supabaseService.getUserData(this.currentUser.uid);
        if (userDataResult.success) {
          console.log('✅ User profile loaded');
          return { 
            success: true, 
            user: {
              ...userDataResult.data,
              uid: this.currentUser.uid,
              email: this.currentUser.email,
              emailVerified: this.currentUser.emailVerified,
            },
            firebaseUser: this.currentUser,
            isVerified: this.currentUser.emailVerified
          };
        } else {
          const basicUser = {
            uid: this.currentUser.uid,
            email: this.currentUser.email,
            fullName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
            username: this.currentUser.displayName || this.currentUser.email.split('@')[0],
            phone: '',
            emailVerified: this.currentUser.emailVerified,
            profilePhoto: this.currentUser.photoURL || null,
            firebaseAuth: true
          };
          
          await supabaseService.saveUserData(this.currentUser.uid, basicUser);
          
          return { 
            success: true, 
            user: basicUser,
            firebaseUser: this.currentUser,
            isVerified: this.currentUser.emailVerified
          };
        }
      }
      
      console.log('⚠️ No current user found');
      return { success: false, user: null };
    } catch (error) {
      console.error('❌ AGROF: Error getting current user:', error);
      return { success: false, error: error.message };
    }
  }

  // Load user data from Supabase
  async loadUserDataFromSupabase(uid) {
    try {
      console.log('🟢 Loading user data from Supabase for UID:', uid);
      const result = await supabaseService.getUserData(uid);
      
      if (result.success) {
        console.log('✅ User data loaded:', result.data.username);
        return result.data;
      } else {
        console.log('⚠️ No user data found for UID:', uid);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      return null;
    }
  }

  // Update user data
  async updateUserData(uid, data) {
    try {
      console.log('🔥🟢 AGROF: Updating user data');
      
      const result = await supabaseService.updateUserData(uid, data);
      
      if (result.success) {
        console.log('✅ User data updated');
        return { success: true, message: 'Profile updated successfully!' };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ AGROF: Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(uid, imageUri) {
    try {
      console.log('📸 AGROF: Uploading profile photo');
      
      const result = await supabaseService.uploadProfilePhoto(uid, imageUri);
      
      if (result.success) {
        console.log('✅ Profile photo uploaded');
        return { success: true, url: result.url };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ AGROF: Error uploading profile photo:', error);
      return { success: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      console.log('🔥🟢 AGROF: Health check');
      
      const supabaseHealth = await supabaseService.healthCheck();
      
      return { 
        connected: true, 
        initialized: this.isInitialized,
        firebaseAuth: !!this.currentUser,
        supabaseAvailable: supabaseHealth.supabaseAvailable,
        storageType: supabaseHealth.storageType,
        currentUser: this.currentUser ? this.currentUser.uid : null
      };
    } catch (error) {
      console.error('❌ AGROF: Health check error:', error);
      return { 
        connected: false, 
        initialized: false,
        firebaseAuth: false,
        supabaseAvailable: false,
        storageType: 'None',
        error: error.message
      };
    }
  }

  // Cleanup
  destroy() {
    if (this.authStateListener) {
      this.authStateListener();
    }
  }

  // Expose Firebase onAuthStateChanged listener
  onAuthStateChanged(callback) {
    console.log('👂 AGROF: Setting up auth state listener');
    return onAuthStateChanged(auth, callback);
  }
}

export default new AuthService();






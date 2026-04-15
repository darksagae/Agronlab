import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { isCognitoAuth } from '../config/authConfig';
import * as cognitoAuthService from './cognitoAuthService';
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
      const supabaseSuccess = await supabaseService.initialize();
      if (!supabaseSuccess) {
        console.log('⚠️ Supabase initialization failed, continuing with auth + local fallbacks');
      }

      if (isCognitoAuth()) {
        console.log('🔷 AGROF: Initializing Cognito + Supabase...');
        const cognitoUser = await cognitoAuthService.getCurrentAuthenticatedUser();
        if (cognitoUser) {
          this.currentUser = cognitoUser;
          await this.updateLastActive();
          await this.loadUserDataFromSupabase(cognitoUser.uid);
        } else {
          this.currentUser = null;
        }
        this.isInitialized = true;
        console.log('✅ AGROF: Cognito auth initialized');
        return true;
      }

      console.log('🔥🟢 AGROF: Initializing Firebase Auth + Supabase service...');
      
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
      if (isCognitoAuth()) {
        console.log('🔷 AGROF: Cognito sign up');
        const normalized = email.trim().toLowerCase();
        const { userSub } = await cognitoAuthService.signUp(normalized, password, {
          fullName: userData.fullName,
          phone: userData.phone,
        });

        const completeUserData = {
          uid: userSub,
          email: normalized,
          fullName: userData.fullName || normalized.split('@')[0],
          username: userData.username || userData.fullName || normalized.split('@')[0],
          phone: userData.phone || '',
          emailVerified: false,
          profilePhoto: null,
          agrofBalance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: 'cognito',
          contactInfo: {
            email: normalized,
            phone: userData.phone || '',
            fullName: userData.fullName || normalized.split('@')[0],
          },
        };

        const saveResult = await supabaseService.saveUserData(userSub, completeUserData);
        if (!saveResult.success) {
          console.error('❌ Supabase save after Cognito sign up:', saveResult.error);
        }

        return {
          success: true,
          user: completeUserData,
          needsEmailVerification: true,
          authProvider: 'cognito',
        };
      }

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
      const msg = isCognitoAuth()
        ? cognitoAuthService.cognitoErrorMessage(error)
        : error.message || String(error);
      return { success: false, error: msg };
    }
  }

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      if (isCognitoAuth()) {
        console.log('🔷 AGROF: Cognito sign in');
        const normalized = email.trim().toLowerCase();
        let cognitoResult;
        try {
          cognitoResult = await cognitoAuthService.signIn(normalized, password);
        } catch (e) {
          const msg = cognitoAuthService.cognitoErrorMessage(e);
          if (/UserNotConfirmedException|not\s*confirmed/i.test(msg)) {
            return {
              success: false,
              error:
                '📧 Account not verified\n\nEnter the verification code we emailed you, or resend the code from the verification screen.',
              needsVerification: true,
              userEmail: normalized,
              authProvider: 'cognito',
            };
          }
          return { success: false, error: msg };
        }

        const { user: cognitoUser } = cognitoResult;
        this.currentUser = cognitoUser;

        const userDataResult = await supabaseService.getUserData(cognitoUser.uid);
        let userData;
        if (userDataResult.success) {
          userData = userDataResult.data;
        } else {
          userData = {
            uid: cognitoUser.uid,
            email: cognitoUser.email,
            fullName: cognitoUser.displayName || normalized.split('@')[0],
            username: cognitoUser.displayName || normalized.split('@')[0],
            phone: '',
            emailVerified: cognitoUser.emailVerified !== false,
            profilePhoto: null,
            agrofBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authProvider: 'cognito',
            contactInfo: {
              email: cognitoUser.email,
              phone: '',
              fullName: cognitoUser.displayName || normalized.split('@')[0],
            },
          };
          await supabaseService.saveUserData(cognitoUser.uid, userData);
        }

        await this.updateLastActive();
        return {
          success: true,
          user: { ...userData, emailVerified: cognitoUser.emailVerified !== false },
          firebaseUser: cognitoUser,
          authProvider: 'cognito',
        };
      }

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

  /** Confirm sign-up with the verification code emailed by Cognito (or custom SES flow). */
  async confirmSignUpWithCode(email, code) {
    try {
      if (!isCognitoAuth()) {
        return {
          success: false,
          error: 'Code verification is only used with Cognito. Use the email link for Firebase.',
        };
      }
      await cognitoAuthService.confirmSignUp(email.trim().toLowerCase(), code);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: cognitoAuthService.cognitoErrorMessage(error),
      };
    }
  }

  // Resend verification email
  async resendVerificationEmail(email, password = null) {
    try {
      if (isCognitoAuth()) {
        console.log('🔷 Resending Cognito confirmation code to:', email);
        await cognitoAuthService.resendConfirmationCode(email.trim().toLowerCase());
        return { success: true };
      }

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
      if (isCognitoAuth()) {
        console.log('🔷 AGROF: Signing out from Cognito');
        await cognitoAuthService.signOut();
        this.currentUser = null;
        await AsyncStorage.removeItem('agrof_users');
        await this.clearSession();
        return { success: true };
      }

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
      if (isCognitoAuth()) {
        const cognitoUser =
          this.currentUser || (await cognitoAuthService.getCurrentAuthenticatedUser());
        if (!cognitoUser) {
          return { success: false, user: null };
        }
        this.currentUser = cognitoUser;
        const userDataResult = await supabaseService.getUserData(cognitoUser.uid);
        if (userDataResult.success) {
          return {
            success: true,
            user: {
              ...userDataResult.data,
              uid: cognitoUser.uid,
              email: cognitoUser.email,
              emailVerified: cognitoUser.emailVerified,
            },
            firebaseUser: cognitoUser,
            isVerified: cognitoUser.emailVerified,
          };
        }
        return {
          success: true,
          user: {
            uid: cognitoUser.uid,
            email: cognitoUser.email,
            fullName: cognitoUser.displayName,
            emailVerified: cognitoUser.emailVerified,
          },
          firebaseUser: cognitoUser,
          isVerified: cognitoUser.emailVerified,
        };
      }

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

  /** Password reset email (Firebase link or Cognito forgot-password code). */
  async sendPasswordResetEmail(email) {
    try {
      const trimmed = (email || '').trim();
      if (!trimmed) {
        return { success: false, error: 'Email is required' };
      }
      if (isCognitoAuth()) {
        await cognitoAuthService.forgotPassword(trimmed.toLowerCase());
        return {
          success: true,
          message: 'If an account exists, a reset code was sent to your email.',
        };
      }
      await sendPasswordResetEmail(auth, trimmed);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
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






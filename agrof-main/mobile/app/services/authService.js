import { Hub } from 'aws-amplify/utils';
import * as cognitoAuthService from './cognitoAuthService';
import userProfileService from './userProfileService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isCognitoAuth, isCognitoConfigured } from '../config/authConfig';

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.hubListener = null;
    this.sessionTimeout = 30 * 60 * 1000;
    this.lastActiveTime = null;
  }

  async isSessionValid() {
    try {
      const lastActive = await AsyncStorage.getItem('agrof_last_active');
      if (!lastActive) return false;
      const now = Date.now();
      const timeSinceActive = now - parseInt(lastActive, 10);
      if (timeSinceActive > this.sessionTimeout) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }

  async updateLastActive() {
    try {
      await AsyncStorage.setItem('agrof_last_active', Date.now().toString());
      this.lastActiveTime = Date.now();
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }

  async clearSession() {
    try {
      await AsyncStorage.removeItem('agrof_last_active');
      this.lastActiveTime = null;
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  async _refreshCurrentUserFromCognito() {
    if (!isCognitoConfigured()) {
      this.currentUser = null;
      return;
    }
    const u = await cognitoAuthService.getCurrentAuthenticatedUser();
    this.currentUser = u;
  }

  async initialize() {
    try {
      await userProfileService.initialize();

      if (!isCognitoAuth()) {
        console.error(
          'AGRON: Cognito is not configured. Add amplify_outputs.json (from `npm run sandbox`) or set EXPO_PUBLIC_AUTH_PROVIDER=cognito and EXPO_PUBLIC_COGNITO_*.'
        );
        this.isInitialized = true;
        return false;
      }

      console.log('AGRON: Initializing Cognito (Amplify) + local profile...');

      await this._refreshCurrentUserFromCognito();
      if (this.currentUser) {
        const sessionValid = await this.isSessionValid();
        if (!sessionValid) {
          await cognitoAuthService.signOut();
          this.currentUser = null;
          await this.clearSession();
        } else {
          await this.updateLastActive();
          await this.loadUserProfileData(this.currentUser.uid);
        }
      }

      this.hubListener = Hub.listen('auth', async ({ payload }) => {
        const { event } = payload;
        if (
          event === 'signedIn' ||
          event === 'signedOut' ||
          event === 'tokenRefresh' ||
          event === 'signInWithRedirect'
        ) {
          await this._refreshCurrentUserFromCognito();
          if (this.currentUser) {
            await this.loadUserProfileData(this.currentUser.uid);
          }
        }
      });

      this.isInitialized = true;
      console.log('AGRON: Cognito auth initialized');
      return true;
    } catch (error) {
      console.error('AGRON: Service initialization failed:', error);
      return false;
    }
  }

  /** Synchronous uid for cart/order helpers (updated on sign-in / Hub events). */
  getCachedUserId() {
    return this.currentUser?.uid || null;
  }

  getCachedUserEmail() {
    return this.currentUser?.email || null;
  }

  async signUpWithEmail(email, password, userData = {}) {
    try {
      console.log('AGRON: Cognito sign up');
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
        country: userData.country || '',
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

      const saveResult = await userProfileService.saveUserData(userSub, completeUserData);
      if (!saveResult.success) {
        console.error('AGRON: Local profile save after sign up:', saveResult.error);
      }

      return {
        success: true,
        user: completeUserData,
        needsEmailVerification: true,
        authProvider: 'cognito',
      };
    } catch (error) {
      console.error('AGRON: Sign up error:', error);
      return {
        success: false,
        error: cognitoAuthService.cognitoErrorMessage(error),
      };
    }
  }

  async signInWithEmail(email, password) {
    try {
      console.log('AGRON: Cognito sign in');
      const normalized = email.trim().toLowerCase();
      let cognitoResult;
      try {
        cognitoResult = await cognitoAuthService.signIn(normalized, password);
      } catch (e) {
        const msg = cognitoAuthService.cognitoErrorMessage(e);
        const code = e?.name || e?.code || e?.__type || '';
        const raw = `${code} ${e?.message || ''} ${msg || ''}`;
        if (
          code === 'UserNotConfirmedException' ||
          /UserNotConfirmedException|user_not_confirmed|not\s*confirmed|CONFIRM_SIGN_UP|not verified|verification code|verify your email/i.test(
            raw
          )
        ) {
          return {
            success: false,
            error:
              'Account not verified\n\nEnter the verification code we emailed you, or resend the code from the verification screen.',
            needsVerification: true,
            userEmail: normalized,
            authProvider: 'cognito',
          };
        }
        return { success: false, error: msg };
      }

      const { user: cognitoUser } = cognitoResult;
      this.currentUser = cognitoUser;

      const userDataResult = await userProfileService.getUserData(cognitoUser.uid);
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
        await userProfileService.saveUserData(cognitoUser.uid, userData);
      }

      await this.updateLastActive();
      return {
        success: true,
        user: { ...userData, emailVerified: cognitoUser.emailVerified !== false },
        firebaseUser: cognitoUser,
        authProvider: 'cognito',
      };
    } catch (error) {
      console.error('AGRON: Sign in error:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async confirmSignUpWithCode(email, code) {
    try {
      await cognitoAuthService.confirmSignUp(email.trim().toLowerCase(), code);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: cognitoAuthService.cognitoErrorMessage(error),
      };
    }
  }

  async resendVerificationEmail(email) {
    try {
      console.log('Resending Cognito confirmation code to:', email);
      await cognitoAuthService.resendConfirmationCode(email.trim().toLowerCase());
      return { success: true };
    } catch (error) {
      console.error('Error resending verification code:', error);
      return { success: false, error: cognitoAuthService.cognitoErrorMessage(error) };
    }
  }

  async signOut() {
    try {
      console.log('AGRON: Signing out from Cognito');
      await cognitoAuthService.signOut();
      this.currentUser = null;
      // Keep agrof_users so profile data (photos, prefs) survive across sessions
      await this.clearSession();
      return { success: true };
    } catch (error) {
      console.error('AGRON: Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    try {
      const cognitoUser =
        this.currentUser || (await cognitoAuthService.getCurrentAuthenticatedUser());
      if (!cognitoUser) {
        return { success: false, user: null };
      }
      this.currentUser = cognitoUser;
      const userDataResult = await userProfileService.getUserData(cognitoUser.uid);
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
    } catch (error) {
      console.error('AGRON: Error getting current user:', error);
      return { success: false, error: error.message };
    }
  }

  async loadUserProfileData(uid) {
    try {
      const result = await userProfileService.getUserData(uid);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }

  async updateUserData(uid, data) {
    try {
      const result = await userProfileService.updateUserData(uid, data);
      if (result.success) {
        return { success: true, message: 'Profile updated successfully!' };
      }
      throw new Error(result.error);
    } catch (error) {
      console.error('AGRON: Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadProfilePhoto(uid, imageUri) {
    try {
      const result = await userProfileService.uploadProfilePhoto(uid, imageUri);
      if (result.success) {
        return { success: true, url: result.url };
      }
      throw new Error(result.error);
    } catch (error) {
      console.error('AGRON: Error uploading profile photo:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email) {
    try {
      const trimmed = (email || '').trim();
      if (!trimmed) {
        return { success: false, error: 'Email is required' };
      }
      await cognitoAuthService.forgotPassword(trimmed.toLowerCase());
      return {
        success: true,
        message: 'If an account exists, a reset code was sent to your email.',
      };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
    }
  }

  async healthCheck() {
    try {
      const profileHealth = await userProfileService.healthCheck();
      return {
        connected: true,
        initialized: this.isInitialized,
        cognitoAuth: !!this.currentUser,
        firebaseAuth: !!this.currentUser,
        cloudSyncAvailable: profileHealth.cloudSyncAvailable,
        storageType: profileHealth.storageType,
        currentUser: this.currentUser ? this.currentUser.uid : null,
      };
    } catch (error) {
      console.error('AGRON: Health check error:', error);
      return {
        connected: false,
        initialized: false,
        cognitoAuth: false,
        firebaseAuth: false,
        cloudSyncAvailable: false,
        storageType: 'None',
        error: error.message,
      };
    }
  }

  destroy() {
    if (this.hubListener) {
      this.hubListener();
      this.hubListener = null;
    }
  }

  onAuthStateChanged(callback) {
    const handler = async ({ payload }) => {
      const { event } = payload;
      if (
        event === 'signedIn' ||
        event === 'signedOut' ||
        event === 'tokenRefresh'
      ) {
        const u = await cognitoAuthService.getCurrentAuthenticatedUser();
        callback(u);
      }
    };
    const remove = Hub.listen('auth', handler);
    cognitoAuthService.getCurrentAuthenticatedUser().then(callback);
    return remove;
  }
}

export default new AuthService();

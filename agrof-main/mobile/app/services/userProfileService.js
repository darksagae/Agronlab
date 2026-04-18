/**
 * User profile storage — local only (AsyncStorage). Cognito handles auth; no Supabase.
 * Profile photos: URI stored locally; optional Amplify S3 upload can be added later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'agrof_users';

class UserProfileService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    this.isInitialized = true;
    console.log('AGRON: User profile service (local storage) ready');
    return true;
  }

  async healthCheck() {
    return {
      connected: true,
      initialized: this.isInitialized,
      cloudSyncAvailable: false,
      storageType: 'Local (Amplify auth + AsyncStorage)',
    };
  }

  async saveUserDataLocally(uid, userData) {
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_KEY);
      let users = existingUsers ? JSON.parse(existingUsers) : {};
      users[uid] = { ...userData, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      return { success: true };
    } catch (error) {
      console.error('AGRON: Error saving user data locally:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserDataLocally(uid) {
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_KEY);
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users[uid]) {
          return { success: true, data: users[uid] };
        }
      }
      return { success: false, error: 'No user data found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserData(uid) {
    return this.getUserDataLocally(uid);
  }

  async saveUserData(uid, userData) {
    await this.saveUserDataLocally(uid, userData);
    return { success: true, message: 'User data saved locally' };
  }

  async updateUserData(uid, data) {
    const existing = await this.getUserData(uid);
    const merged = {
      ...(existing.success ? existing.data : {}),
      ...data,
      uid,
      updatedAt: new Date().toISOString(),
    };
    const saveResult = await this.saveUserData(uid, merged);
    if (saveResult.success) {
      return { success: true, message: 'Profile updated successfully!' };
    }
    return { success: false, error: saveResult.error };
  }

  async uploadProfilePhoto(uid, imageUri) {
    try {
      const existing = await this.getUserData(uid);
      const user = existing.success ? existing.data : {};
      user.profilePhoto = imageUri;
      user.uid = uid;
      await this.saveUserData(uid, user);
      return { success: true, url: imageUri };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPhoneChangeVerification(email, newPhone) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await AsyncStorage.setItem(
      `phone_verification_${email}`,
      JSON.stringify({ code: verificationCode, phone: newPhone, timestamp: Date.now() })
    );
    return { success: true, code: verificationCode };
  }

  async verifyPhoneChange(uid, code, newPhone, email) {
    const stored = await AsyncStorage.getItem(`phone_verification_${email}`);
    if (!stored) return { success: false, error: 'No verification pending' };
    const { code: storedCode, phone: storedPhone } = JSON.parse(stored);
    if (storedCode === code && storedPhone === newPhone) {
      await this.updateUserData(uid, { phone: newPhone });
      await AsyncStorage.removeItem(`phone_verification_${email}`);
      return { success: true };
    }
    return { success: false, error: 'Invalid verification code or phone number' };
  }

  async getAllUsers() {
    try {
      const raw = await AsyncStorage.getItem(USERS_KEY);
      if (!raw) return { success: true, users: [] };
      const users = JSON.parse(raw);
      const list = Object.values(users);
      return { success: true, users: list };
    } catch (e) {
      return { success: false, users: [], error: e.message };
    }
  }
}

export default new UserProfileService();

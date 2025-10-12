import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabaseConfig';

class SupabaseService {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.supabaseAvailable = false;
  }

  // Initialize Supabase connection
  async initialize() {
    try {
      console.log('🟢 AGROF: Initializing Supabase service...');
      
      // Test Supabase connection
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (!error) {
          this.supabaseAvailable = true;
          console.log('✅ Supabase connection successful');
        } else {
          console.log('⚠️ Supabase not connected, using local storage only');
          console.log('   Error:', error.message);
        }
      } catch (error) {
        console.log('⚠️ Supabase not available, using local storage fallback');
        this.supabaseAvailable = false;
      }
      
      this.isInitialized = true;
      console.log('✅ AGROF Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ AGROF: Initialization error:', error);
      this.isInitialized = true; // Still initialize with local storage
      return true;
    }
  }

  // Health check
  async healthCheck() {
    try {
      console.log('🟢 AGROF: Health check');
      return {
        connected: true,
        initialized: this.isInitialized,
        supabaseAvailable: this.supabaseAvailable,
        storageType: this.supabaseAvailable ? 'Supabase + Local Storage' : 'Local Storage Only'
      };
    } catch (error) {
      console.error('❌ AGROF: Health check error:', error);
      return {
        connected: true,
        initialized: this.isInitialized,
        supabaseAvailable: false,
        storageType: 'Local Storage Only'
      };
    }
  }

  // Save user data to Supabase
  async saveUserDataToSupabase(uid, userData) {
    try {
      console.log('🟢 Saving user data to Supabase for UID:', uid);
      
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: uid,
          email: userData.email,
          full_name: userData.fullName,
          username: userData.username,
          phone: userData.phone,
          profile_photo: userData.profilePhoto,
          agrof_balance: userData.agrofBalance || 0,
          email_verified: userData.emailVerified || false,
          firebase_auth: true,
          contact_info: userData.contactInfo,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ User data saved to Supabase!');
      return { success: true, data };
    } catch (error) {
      console.error('⚠️ Supabase save failed:', error.message);
      console.error('   Falling back to local storage');
      return { success: false, error: error.message };
    }
  }

  // Get user data from Supabase
  async getUserDataFromSupabase(uid) {
    try {
      console.log('🟢 Getting user data from Supabase for UID:', uid);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('✅ User data loaded from Supabase!');
        // Convert from snake_case to camelCase
        const userData = {
          uid: data.id,
          email: data.email,
          fullName: data.full_name,
          username: data.username,
          phone: data.phone,
          profilePhoto: data.profile_photo,
          userType: data.user_type,
          agrofBalance: data.agrof_balance,
          emailVerified: data.email_verified,
          contactInfo: data.contact_info,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        return { success: true, data: userData };
      }
      
      throw new Error('User not found');
    } catch (error) {
      console.warn('⚠️ Supabase load failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Save user data locally (fallback)
  async saveUserDataLocally(uid, userData) {
    try {
      console.log('💾 Saving user data locally for UID:', uid);
      
      const existingUsers = await AsyncStorage.getItem('agrof_users');
      let users = existingUsers ? JSON.parse(existingUsers) : {};
      
      users[uid] = {
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('agrof_users', JSON.stringify(users));
      
      console.log('✅ User data saved locally');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving user data locally:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user data locally (fallback)
  async getUserDataLocally(uid) {
    try {
      console.log('💾 Getting user data locally for UID:', uid);
      const existingUsers = await AsyncStorage.getItem('agrof_users');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users[uid]) {
          console.log('✅ User data found locally');
          return { success: true, data: users[uid] };
        }
      }
      console.log('⚠️ No user data found locally');
      return { success: false, error: 'No user data found' };
    } catch (error) {
      console.error('❌ Error getting user data locally:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user data (primary method) - Try Supabase first, fallback to local
  async getUserData(uid) {
    try {
      console.log('🟢 AGROF: Getting user data for:', uid);
      
      // Try Supabase first if available
      if (this.supabaseAvailable) {
        const supabaseResult = await this.getUserDataFromSupabase(uid);
        if (supabaseResult.success) {
          // Cache locally
          await this.saveUserDataLocally(uid, supabaseResult.data);
          return supabaseResult;
        }
      }
      
      // Fallback to local storage
      return await this.getUserDataLocally(uid);
    } catch (error) {
      console.error('❌ AGROF: Error getting user data:', error);
      return await this.getUserDataLocally(uid);
    }
  }

  // Save user data (primary method) - Save to Supabase and local
  async saveUserData(uid, userData) {
    try {
      console.log('🟢 Saving user data for UID:', uid);
      
      // Always save locally first (for offline support)
      await this.saveUserDataLocally(uid, userData);
      
      // Try Supabase if available
      if (this.supabaseAvailable) {
        const supabaseResult = await this.saveUserDataToSupabase(uid, userData);
        if (supabaseResult.success) {
          return { success: true, message: 'User data saved to Supabase!' };
        }
      }
      
      // If Supabase not available, local save is still successful
      return { success: true, message: 'User data saved locally!' };
    } catch (error) {
      console.error('❌ Error saving user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user data
  async updateUserData(uid, data) {
    try {
      console.log('🟢 AGROF: Updating user data for:', uid);
      
      // Get existing user data
      const existingData = await this.getUserData(uid);
      let userData = existingData.success ? existingData.data : {};
      
      // Merge with new data
      userData = {
        ...userData,
        ...data,
        uid: uid,
        updatedAt: new Date().toISOString()
      };
      
      // Save updated data
      const saveResult = await this.saveUserData(uid, userData);
      
      if (saveResult.success) {
        console.log('✅ User data updated successfully');
        return { success: true, message: 'Profile updated successfully!' };
      } else {
        throw new Error(saveResult.error);
      }
    } catch (error) {
      console.error('❌ AGROF: Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload profile photo to Supabase Storage
  async uploadProfilePhoto(uid, imageUri) {
    try {
      console.log('📸 AGROF: Uploading profile photo for:', uid);
      
      if (this.supabaseAvailable) {
        try {
          // Read the image file
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          const fileName = `profile_${uid}_${Date.now()}.jpg`;
          const filePath = `profile-photos/${uid}/${fileName}`;
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('user-uploads')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: true
            });
          
          if (error) throw error;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(filePath);
          
          console.log('✅ Photo uploaded to Supabase:', publicUrl);
          return { success: true, url: publicUrl };
        } catch (supabaseError) {
          console.log('⚠️ Supabase upload failed, saving locally:', supabaseError.message);
        }
      }
      
      // Fallback: Save locally
      console.log('💾 Saving photo URI locally');
      return { success: true, url: imageUri };
    } catch (error) {
      console.error('❌ AGROF: Error uploading profile photo:', error);
      return { success: false, error: error.message };
    }
  }

  // Send phone change verification
  async sendPhoneChangeVerification(email, newPhone) {
    try {
      console.log('📱 AGROF: Generating phone verification code');
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
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
  async verifyPhoneChange(uid, code, newPhone, email) {
    try {
      console.log('🟢 AGROF: Verifying phone change for:', uid);
      const storedVerification = await AsyncStorage.getItem(`phone_verification_${email}`);
      if (storedVerification) {
        const { code: storedCode, phone: storedPhone } = JSON.parse(storedVerification);
        if (storedCode === code && storedPhone === newPhone) {
          console.log('✅ Phone verification successful');
          await this.updateUserData(uid, { phone: newPhone });
          await AsyncStorage.removeItem(`phone_verification_${email}`);
          return { success: true };
        }
      }
      return { success: false, error: 'Invalid verification code or phone number' };
    } catch (error) {
      console.error('❌ AGROF: Error verifying phone change:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all users from Supabase
  async getAllUsers() {
    try {
      console.log('👥 Fetching all users from Supabase...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('✅ Loaded', data.length, 'users from Supabase');
        
        // Convert to camelCase format
        const users = data.map(user => ({
          uid: user.id,
          email: user.email,
          fullName: user.full_name,
          username: user.username,
          phone: user.phone,
          profilePhoto: user.profile_photo,
          userType: user.user_type,
          agrofBalance: user.agrof_balance,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        }));
        
        return { success: true, users };
      }
      
      return { success: true, users: [] };
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      return { success: false, error: error.message, users: [] };
    }
  }
}

export default new SupabaseService();
















import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const UserContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  refreshUserData: async () => {},
  updateUserProfile: async () => {},
  signOut: async () => {}
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('👤 UserContext: Initializing...');
    
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        
        const result = await authService.getCurrentUser();
        
        if (result.success && result.user) {
          console.log('✅ UserContext: User data loaded on init');
          console.log('   - Full Name:', result.user.fullName);
          console.log('   - Email:', result.user.email);
          console.log('   - Phone:', result.user.phone);
          console.log('   - Email Verified:', result.user.emailVerified);
          console.log('   - Profile Photo:', result.user.profilePhoto ? 'YES' : 'NO');
          
          setUser(result.user);
          setIsAuthenticated(true);
        } else {
          console.log('❌ UserContext: No user logged in');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ UserContext: Initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserData = async (uid) => {
    console.log('📥 UserContext: Fetching user data for UID:', uid);
    setIsLoading(true);
    
    try {
      const result = await authService.getCurrentUser();
      
      if (result.success && result.user) {
        console.log('✅ UserContext: User data loaded successfully');
        console.log('   - Full Name:', result.user.fullName);
        console.log('   - Email:', result.user.email);
        console.log('   - Phone:', result.user.phone);
        console.log('   - Profile Photo:', result.user.profilePhoto ? 'YES' : 'NO');
        
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        console.error('❌ UserContext: Failed to load user data');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ UserContext: Error fetching user data:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    console.log('🔄 UserContext: Manual refresh requested');
    
    try {
      // Don't rely on existing user state - get fresh data from auth service
      const result = await authService.getCurrentUser();
      
      if (result.success && result.user) {
        console.log('✅ UserContext: Refresh successful');
        console.log('   - Full Name:', result.user.fullName);
        console.log('   - Phone:', result.user.phone);
        
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        console.log('⚠️ UserContext: No authenticated user found during refresh');
        setUser(null);
        setIsAuthenticated(false);
        return { success: false, error: 'No user logged in' };
      }
    } catch (error) {
      console.error('❌ UserContext: Refresh error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updateData) => {
    console.log('📝 UserContext: Updating user profile');
    
    if (!user?.uid) {
      console.error('❌ UserContext: Cannot update - no user logged in');
      return { success: false, error: 'No user logged in' };
    }

    try {
      const result = await authService.updateUserData(user.uid, updateData);
      
      if (result.success) {
        console.log('✅ UserContext: Profile updated, refreshing data');
        await fetchUserData(user.uid);
        return { success: true };
      } else {
        console.error('❌ UserContext: Update failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ UserContext: Update error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    console.log('🔒 UserContext: Signing out user');
    
    try {
      const result = await authService.signOut();
      
      if (result.success) {
        setUser(null);
        setIsAuthenticated(false);
        console.log('✅ UserContext: User signed out successfully');
        return { success: true };
      } else {
        console.error('❌ UserContext: Sign out failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ UserContext: Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    refreshUserData,
    updateUserProfile,
    signOut
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};

export default UserContext;

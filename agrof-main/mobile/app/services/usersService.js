/**
 * Users Service - Fetch all registered users from Supabase
 * Used to display real buyers and sellers in the marketplace
 */

import supabaseService from './supabaseService';

class UsersService {
  constructor() {
    this.cachedUsers = [];
    this.lastFetch = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch all users from Supabase
   * Returns array of user objects with profile data
   */
  async getAllUsers() {
    try {
      console.log('👥 UsersService: Fetching all users from Supabase...');
      
      // Check cache first
      if (this.cachedUsers.length > 0 && this.lastFetch) {
        const cacheAge = Date.now() - this.lastFetch;
        if (cacheAge < this.CACHE_DURATION) {
          console.log('✅ Returning cached users:', this.cachedUsers.length);
          return { success: true, users: this.cachedUsers };
        }
      }

      // Fetch all users from Supabase
      const result = await supabaseService.getAllUsers();
      
      if (result.success && result.users) {
        console.log('✅ Loaded', result.users.length, 'users from Supabase');
        
        // Cache the users
        this.cachedUsers = result.users;
        this.lastFetch = Date.now();
        
        return { success: true, users: result.users };
      }
      
      throw new Error('Failed to fetch users from Supabase');
    } catch (error) {
      console.error('❌ UsersService: Error fetching users:', error);
      return { success: false, error: error.message, users: [] };
    }
  }

  /**
   * Get users by role (buyer/seller)
   * Filters users by their user_type field
   */
  async getUsersByRole(role) {
    try {
      const result = await this.getAllUsers();
      if (result.success) {
        // Filter by role
        const filteredUsers = result.users.filter(user => {
          if (role === 'buyer') {
            return user.user_type === 'buyer' || user.user_type === 'both';
          } else if (role === 'seller') {
            return user.user_type === 'seller' || user.user_type === 'both';
          }
          return true;
        });
        
        console.log(`✅ Found ${filteredUsers.length} ${role}s`);
        return { success: true, users: filteredUsers };
      }
      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${role}s:`, error);
      return { success: false, error: error.message, users: [] };
    }
  }

  /**
   * Clear user cache
   */
  clearCache() {
    this.cachedUsers = [];
    this.lastFetch = null;
    console.log('🧹 UsersService: Cache cleared');
  }
}

export default new UsersService();
















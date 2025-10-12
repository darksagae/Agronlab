import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';

/**
 * Role Request Service
 * Handles user requests to become sellers
 * 
 * KEY FLOW:
 * 1. User (buyer) requests to become seller
 * 2. Submits business details & documents
 * 3. Request stored in Supabase (role_requests table)
 * 4. Admin reviews request
 * 5. If approved → user_type changes to 'both' or 'seller'
 * 6. Seller profile auto-created with business details
 * 7. User can now list products for sale
 * 
 * UUID CORRELATION:
 * - role_requests.user_id = Firebase UID
 * - When approved → sellers.id = same Firebase UID
 * - All user's data (carts, orders, chats) preserved by UUID
 */

class RoleRequestService {
  // Get current user ID from Firebase
  getCurrentUserId() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.warn('⚠️ No user logged in');
    }
    return uid;
  }

  /**
   * Submit request to become a seller
   * @param {object} requestData - Business details
   * @returns {Promise<{success: boolean, request: object}>}
   */
  async submitSellerRequest(requestData) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📝 Submitting seller request for user:', userId);

      // Get current user type
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, email, phone, full_name')
        .eq('id', userId)
        .single();

      if (!userData) {
        return { success: false, error: 'User not found' };
      }

      // Check if user already has pending request
      const { data: existingRequest } = await supabase
        .from('role_requests')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'under_review'])
        .maybeSingle();

      if (existingRequest) {
        return { 
          success: false, 
          error: `You already have a ${existingRequest.status} request. Please wait for review.` 
        };
      }

      // Prepare request data
      const {
        businessName,
        businessLicense,
        taxId,
        businessAddress,
        businessDescription,
        documents,
        contactEmail,
        contactPhone
      } = requestData;

      const { data: request, error } = await supabase
        .from('role_requests')
        .insert({
          user_id: userId,
          requested_role: 'seller',
          existing_role: userData.user_type,
          business_name: businessName,
          business_license: businessLicense,
          tax_id: taxId,
          business_address: businessAddress,
          business_description: businessDescription,
          documents: documents || {},
          contact_email: contactEmail || userData.email,
          contact_phone: contactPhone || userData.phone,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting request:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Seller request submitted:', request.id);
      return { success: true, request };
    } catch (error) {
      console.error('❌ Error in submitSellerRequest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's role requests
   * @returns {Promise<{success: boolean, requests: array}>}
   */
  async getMyRequests() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📋 Getting role requests for user:', userId);

      const { data: requests, error } = await supabase
        .from('role_requests')
        .select(`
          *,
          reviewer:users!role_requests_reviewed_by_fkey(full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting requests:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Requests loaded:', requests.length);
      return { success: true, requests };
    } catch (error) {
      console.error('❌ Error in getMyRequests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending requests (for admin)
   * @returns {Promise<{success: boolean, requests: array}>}
   */
  async getPendingRequests() {
    try {
      console.log('📋 Getting pending role requests...');

      const { data: requests, error } = await supabase
        .from('role_requests')
        .select(`
          *,
          user:users!role_requests_user_id_fkey(
            id,
            full_name,
            email,
            phone,
            profile_photo,
            user_type,
            created_at
          )
        `)
        .in('status', ['pending', 'under_review'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error getting pending requests:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Pending requests loaded:', requests.length);
      return { success: true, requests };
    } catch (error) {
      console.error('❌ Error in getPendingRequests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve a seller request (admin function)
   * @param {string} requestId - UUID of the request
   * @param {string} notes - Optional review notes
   * @returns {Promise<{success: boolean}>}
   */
  async approveRequest(requestId, notes = null) {
    try {
      const adminId = this.getCurrentUserId();
      if (!adminId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ Approving request:', requestId);

      const { data, error } = await supabase
        .rpc('approve_seller_request', {
          p_request_id: requestId,
          p_admin_id: adminId,
          p_notes: notes
        });

      if (error) {
        console.error('❌ Error approving request:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      console.log('✅ Request approved:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in approveRequest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a seller request (admin function)
   * @param {string} requestId - UUID of the request
   * @param {string} reason - Rejection reason
   * @returns {Promise<{success: boolean}>}
   */
  async rejectRequest(requestId, reason) {
    try {
      const adminId = this.getCurrentUserId();
      if (!adminId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('❌ Rejecting request:', requestId);

      const { data, error } = await supabase
        .rpc('reject_seller_request', {
          p_request_id: requestId,
          p_admin_id: adminId,
          p_reason: reason
        });

      if (error) {
        console.error('❌ Error rejecting request:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Request rejected');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in rejectRequest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update request status to 'under_review'
   * @param {string} requestId - UUID of the request
   * @returns {Promise<{success: boolean}>}
   */
  async markAsUnderReview(requestId) {
    try {
      console.log('👀 Marking request as under review:', requestId);

      const { error } = await supabase
        .from('role_requests')
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error updating request status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Request marked as under review');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in markAsUnderReview:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user can request seller role
   * @returns {Promise<{canRequest: boolean, reason: string}>}
   */
  async canRequestSellerRole() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { canRequest: false, reason: 'User not authenticated' };
      }

      // Check user type
      const { data: user } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (!user) {
        return { canRequest: false, reason: 'User not found' };
      }

      // Already a seller
      if (user.user_type === 'seller' || user.user_type === 'both') {
        return { canRequest: false, reason: 'You are already a seller' };
      }

      // Check for pending requests
      const { data: pendingRequest } = await supabase
        .from('role_requests')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'under_review'])
        .maybeSingle();

      if (pendingRequest) {
        return { 
          canRequest: false, 
          reason: `You have a ${pendingRequest.status} request. Please wait for review.` 
        };
      }

      return { canRequest: true, reason: null };
    } catch (error) {
      console.error('❌ Error in canRequestSellerRole:', error);
      return { canRequest: false, reason: error.message };
    }
  }
}

export default new RoleRequestService();





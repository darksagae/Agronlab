import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';

/**
 * Delivery Service
 * Handles all delivery tracking functionality
 * 
 * KEY FLOW:
 * 1. Order is placed (orders.user_id = Firebase UUID)
 * 2. Delivery record auto-created (deliveries.order_id)
 * 3. Driver assigned → Status: 'assigned'
 * 4. Driver picks up → Status: 'picked_up'
 * 5. Driver in transit → Status: 'in_transit' (GPS updates)
 * 6. Driver arrives → Status: 'arrived'
 * 7. Customer receives → Status: 'delivered' (proof of delivery)
 * 
 * UUID CORRELATION:
 * - deliveries.order_id → orders.id
 * - orders.user_id = Firebase UUID
 * - User can track delivery via their UUID
 * - All tracking history preserved
 */

class DeliveryService {
  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }

  /**
   * Create delivery for an order
   * @param {string} orderId - UUID of the order
   * @param {object} deliveryDetails - Pickup/delivery addresses
   * @returns {Promise<{success: boolean, delivery: object}>}
   */
  async createDelivery(orderId, deliveryDetails) {
    try {
      console.log('🚚 Creating delivery for order:', orderId);

      const { pickupAddress, deliveryAddress, providerId = null, instructions = '' } = deliveryDetails;

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          order_id: orderId,
          provider_id: providerId,
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
          recipient_name: deliveryAddress.name,
          recipient_phone: deliveryAddress.phone,
          delivery_instructions: instructions,
          current_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating delivery:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Delivery created:', delivery.tracking_number);
      return { success: true, delivery };
    } catch (error) {
      console.error('❌ Error in createDelivery:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get delivery for an order
   * @param {string} orderId - UUID of the order
   * @returns {Promise<{success: boolean, delivery: object}>}
   */
  async getDeliveryForOrder(orderId) {
    try {
      console.log('📦 Getting delivery for order:', orderId);

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          provider:delivery_providers(name, contact_phone),
          driver:delivery_drivers(driver_name, driver_phone, vehicle_type, current_location),
          tracking_events:delivery_tracking_events(
            status,
            location,
            notes,
            created_at
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { foreignTable: 'delivery_tracking_events', ascending: true })
        .single();

      if (error) {
        console.error('❌ Error getting delivery:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Delivery loaded:', delivery.tracking_number);
      return { success: true, delivery };
    } catch (error) {
      console.error('❌ Error in getDeliveryForOrder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track delivery by tracking number
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<{success: boolean, delivery: object}>}
   */
  async trackDelivery(trackingNumber) {
    try {
      console.log('📍 Tracking delivery:', trackingNumber);

      const { data: delivery, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders(order_number, total_amount, customer_phone),
          provider:delivery_providers(name, contact_phone),
          driver:delivery_drivers(driver_name, driver_phone, current_location),
          tracking_events:delivery_tracking_events(
            status,
            location,
            notes,
            photo_url,
            created_at
          )
        `)
        .eq('tracking_number', trackingNumber)
        .order('created_at', { foreignTable: 'delivery_tracking_events', ascending: true })
        .single();

      if (error) {
        console.error('❌ Error tracking delivery:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Delivery tracked:', delivery.current_status);
      return { success: true, delivery };
    } catch (error) {
      console.error('❌ Error in trackDelivery:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update delivery status (driver/admin function)
   * @param {string} deliveryId - UUID of the delivery
   * @param {string} newStatus - New status
   * @param {object} updateData - Additional data (location, notes, photos)
   * @returns {Promise<{success: boolean}>}
   */
  async updateDeliveryStatus(deliveryId, newStatus, updateData = {}) {
    try {
      console.log('📝 Updating delivery status:', deliveryId, newStatus);

      const { location = null, notes = '', photoUrl = null } = updateData;

      const updatePayload = {
        current_status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set timestamps based on status
      if (newStatus === 'picked_up' && !updateData.skipTimestamp) {
        updatePayload.actual_pickup = new Date().toISOString();
      } else if (newStatus === 'delivered' && !updateData.skipTimestamp) {
        updatePayload.actual_delivery = new Date().toISOString();
      }

      // Update location if provided
      if (location) {
        updatePayload.current_location = {
          ...location,
          updated_at: new Date().toISOString()
        };
      }

      const { error: updateError } = await supabase
        .from('deliveries')
        .update(updatePayload)
        .eq('id', deliveryId);

      if (updateError) {
        console.error('❌ Error updating delivery:', updateError);
        return { success: false, error: updateError.message };
      }

      // Add tracking event
      const eventBy = this.getCurrentUserId();
      const { error: eventError } = await supabase
        .from('delivery_tracking_events')
        .insert({
          delivery_id: deliveryId,
          status: newStatus,
          location,
          notes,
          photo_url: photoUrl,
          event_by: eventBy,
          event_type: 'status_update'
        });

      if (eventError) {
        console.warn('⚠️ Error creating tracking event:', eventError);
      }

      console.log('✅ Delivery status updated to:', newStatus);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updateDeliveryStatus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update driver location (real-time GPS tracking)
   * @param {string} deliveryId - UUID of the delivery
   * @param {object} location - {lat, lng, address}
   * @returns {Promise<{success: boolean}>}
   */
  async updateDriverLocation(deliveryId, location) {
    try {
      console.log('📍 Updating driver location for delivery:', deliveryId);

      const { error } = await supabase
        .from('deliveries')
        .update({
          current_location: {
            ...location,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) {
        console.error('❌ Error updating location:', error);
        return { success: false, error: error.message };
      }

      // Optional: Add location tracking event (for history)
      await supabase
        .from('delivery_tracking_events')
        .insert({
          delivery_id: deliveryId,
          status: 'in_transit',
          location,
          event_type: 'location_update'
        });

      console.log('✅ Location updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updateDriverLocation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark delivery as delivered with proof
   * @param {string} deliveryId - UUID of the delivery
   * @param {object} proofData - {signatureUrl, photoUrl, receivedBy}
   * @returns {Promise<{success: boolean}>}
   */
  async markAsDelivered(deliveryId, proofData) {
    try {
      console.log('✅ Marking delivery as delivered:', deliveryId);

      const { signatureUrl, photoUrl, receivedBy } = proofData;

      const { error } = await supabase
        .from('deliveries')
        .update({
          current_status: 'delivered',
          actual_delivery: new Date().toISOString(),
          signature_url: signatureUrl,
          photo_url: photoUrl,
          received_by: receivedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) {
        console.error('❌ Error marking as delivered:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Delivery marked as delivered');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in markAsDelivered:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's deliveries (all orders with tracking)
   * @returns {Promise<{success: boolean, deliveries: array}>}
   */
  async getMyDeliveries() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📦 Getting deliveries for user:', userId);

      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders!inner(
            id,
            order_number,
            total_amount,
            user_id,
            created_at
          ),
          provider:delivery_providers(name),
          driver:delivery_drivers(driver_name, driver_phone)
        `)
        .eq('order.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting deliveries:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Deliveries loaded:', deliveries.length);
      return { success: true, deliveries };
    } catch (error) {
      console.error('❌ Error in getMyDeliveries:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all delivery providers
   * @returns {Promise<{success: boolean, providers: array}>}
   */
  async getProviders() {
    try {
      console.log('🚛 Getting delivery providers...');

      const { data: providers, error } = await supabase
        .from('delivery_providers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error getting providers:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Providers loaded:', providers.length);
      return { success: true, providers };
    } catch (error) {
      console.error('❌ Error in getProviders:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to delivery updates (real-time tracking)
   * @param {string} deliveryId - UUID of the delivery
   * @param {function} onUpdate - Callback when delivery updates
   * @returns {function} Unsubscribe function
   */
  subscribeToDelivery(deliveryId, onUpdate) {
    console.log('🔔 Subscribing to delivery updates:', deliveryId);

    const subscription = supabase
      .channel(`delivery:${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`
        },
        async (payload) => {
          console.log('🔔 Delivery updated:', payload.new.current_status);
          
          // Fetch full delivery details
          const { data: delivery } = await supabase
            .from('deliveries')
            .select(`
              *,
              driver:delivery_drivers(driver_name, driver_phone, current_location)
            `)
            .eq('id', deliveryId)
            .single();

          if (delivery && onUpdate) {
            onUpdate(delivery);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from delivery updates');
      subscription.unsubscribe();
    };
  }
}

export default new DeliveryService();





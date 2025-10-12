import { supabase } from '../config/supabaseConfig';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Messaging Service
 * Handles all chat/messaging functionality between users
 * 
 * KEY CONCEPT:
 * - Firebase provides the unique UUID for each user
 * - Supabase stores all conversations and messages
 * - Conversations are linked by user UUIDs
 * - Messages are linked by conversation ID and user UUIDs
 */

class MessagingService {
  constructor() {
    this.localCacheKey = 'agrof_conversations';
    this.conversationSubscription = null;
    this.messageSubscriptions = new Map(); // Track message subscriptions per conversation
  }

  // Get current user ID from Firebase
  getCurrentUserId() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.warn('⚠️ No user logged in');
    }
    return uid;
  }

  /**
   * Get or create a conversation between current user and another user
   * @param {string} otherUserId - UUID of the other user
   * @returns {Promise<{success: boolean, conversation: object}>}
   */
  async getOrCreateConversation(otherUserId) {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('💬 Getting/Creating conversation between:', currentUserId, 'and', otherUserId);

      // Use the database function to get or create conversation
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: currentUserId,
          p_user2_id: otherUserId
        });

      if (error) {
        console.error('❌ Error getting/creating conversation:', error);
        return { success: false, error: error.message };
      }

      const conversationId = data;

      // Fetch full conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:users!conversations_user1_id_fkey(id, full_name, profile_photo, user_type),
          user2:users!conversations_user2_id_fkey(id, full_name, profile_photo, user_type)
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching conversation details:', fetchError);
        return { success: false, error: fetchError.message };
      }

      console.log('✅ Conversation ready:', conversationId);
      return { success: true, conversation };
    } catch (error) {
      console.error('❌ Error in getOrCreateConversation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all conversations for current user
   * @returns {Promise<{success: boolean, conversations: array}>}
   */
  async getConversations() {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('💬 Loading conversations for user:', currentUserId);

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:users!conversations_user1_id_fkey(id, full_name, profile_photo, user_type),
          user2:users!conversations_user2_id_fkey(id, full_name, profile_photo, user_type)
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('❌ Error loading conversations:', error);
        return await this.getLocalConversations();
      }

      // Process conversations to add "other user" info
      const processedConversations = conversations.map(conv => {
        const isUser1 = conv.user1_id === currentUserId;
        const otherUser = isUser1 ? conv.user2 : conv.user1;
        const unreadCount = isUser1 ? conv.unread_count_user1 : conv.unread_count_user2;

        return {
          ...conv,
          otherUser,
          unreadCount,
          isUser1
        };
      });

      // Cache locally
      await this.saveLocalConversations(processedConversations);

      console.log('✅ Conversations loaded:', processedConversations.length);
      return { success: true, conversations: processedConversations };
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      return await this.getLocalConversations();
    }
  }

  /**
   * Get messages in a conversation
   * @param {string} conversationId - UUID of the conversation
   * @param {number} limit - Number of messages to load (default 50)
   * @param {number} offset - Pagination offset
   * @returns {Promise<{success: boolean, messages: array}>}
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('💬 Loading messages for conversation:', conversationId);

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, profile_photo),
          receiver:users!messages_receiver_id_fkey(id, full_name, profile_photo),
          product:products(id, name, price, images),
          order:orders(id, order_number, status)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error loading messages:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Messages loaded:', messages.length);
      return { success: true, messages };
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a message
   * @param {string} conversationId - UUID of the conversation
   * @param {string} receiverId - UUID of the receiver
   * @param {object} messageData - {text, type, attachments, productId, orderId}
   * @returns {Promise<{success: boolean, message: object}>}
   */
  async sendMessage(conversationId, receiverId, messageData) {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📤 Sending message to:', receiverId);

      const { text, type = 'text', attachments = [], productId = null, orderId = null } = messageData;

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: receiverId,
          message_text: text,
          message_type: type,
          attachments,
          related_product_id: productId,
          related_order_id: orderId
        })
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, profile_photo)
        `)
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Message sent:', message.id);
      return { success: true, message };
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - UUID of the conversation
   * @returns {Promise<{success: boolean}>}
   */
  async markMessagesAsRead(conversationId) {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('👁️ Marking messages as read in conversation:', conversationId);

      const { error } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: currentUserId
        });

      if (error) {
        console.error('❌ Error marking messages as read:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Messages marked as read');
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a message (soft delete)
   * @param {string} messageId - UUID of the message
   * @returns {Promise<{success: boolean}>}
   */
  async deleteMessage(messageId) {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('🗑️ Deleting message:', messageId);

      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_by: currentUserId,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', currentUserId); // Only sender can delete their own messages

      if (error) {
        console.error('❌ Error deleting message:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Message deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread message count
   * @returns {Promise<{success: boolean, count: number}>}
   */
  async getUnreadCount() {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('unread_count_user1, unread_count_user2, user1_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

      if (error) {
        console.error('❌ Error getting unread count:', error);
        return { success: false, error: error.message };
      }

      // Calculate total unread count
      const totalUnread = conversations.reduce((sum, conv) => {
        const unread = conv.user1_id === currentUserId 
          ? conv.unread_count_user1 
          : conv.unread_count_user2;
        return sum + unread;
      }, 0);

      console.log('📨 Total unread messages:', totalUnread);
      return { success: true, count: totalUnread };
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to real-time message updates
   * @param {string} conversationId - UUID of the conversation
   * @param {function} onNewMessage - Callback when new message arrives
   * @returns {function} Unsubscribe function
   */
  subscribeToMessages(conversationId, onNewMessage) {
    console.log('🔔 Subscribing to messages in conversation:', conversationId);

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('🔔 New message received:', payload.new.id);
          
          // Fetch full message details with related data
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(id, full_name, profile_photo)
            `)
            .eq('id', payload.new.id)
            .single();

          if (message && onNewMessage) {
            onNewMessage(message);
          }
        }
      )
      .subscribe();

    // Store subscription
    this.messageSubscriptions.set(conversationId, subscription);

    // Return unsubscribe function
    return () => {
      console.log('🔕 Unsubscribing from messages:', conversationId);
      subscription.unsubscribe();
      this.messageSubscriptions.delete(conversationId);
    };
  }

  /**
   * Subscribe to conversation list updates
   * @param {function} onUpdate - Callback when conversations change
   * @returns {function} Unsubscribe function
   */
  subscribeToConversations(onUpdate) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      console.warn('⚠️ Cannot subscribe - user not authenticated');
      return () => {};
    }

    console.log('🔔 Subscribing to conversation updates');

    this.conversationSubscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          console.log('🔔 Conversation updated:', payload);
          if (onUpdate) {
            const result = await this.getConversations();
            if (result.success) {
              onUpdate(result.conversations);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from conversations');
      if (this.conversationSubscription) {
        this.conversationSubscription.unsubscribe();
        this.conversationSubscription = null;
      }
    };
  }

  // Local storage fallback
  async getLocalConversations() {
    try {
      const data = await AsyncStorage.getItem(this.localCacheKey);
      const conversations = data ? JSON.parse(data) : [];
      return { success: true, conversations };
    } catch (error) {
      console.error('❌ Error getting local conversations:', error);
      return { success: true, conversations: [] };
    }
  }

  async saveLocalConversations(conversations) {
    try {
      await AsyncStorage.setItem(this.localCacheKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('❌ Error saving local conversations:', error);
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    console.log('🧹 Cleaning up messaging subscriptions');
    
    if (this.conversationSubscription) {
      this.conversationSubscription.unsubscribe();
    }

    this.messageSubscriptions.forEach((subscription, conversationId) => {
      subscription.unsubscribe();
    });
    
    this.messageSubscriptions.clear();
  }
}

export default new MessagingService();

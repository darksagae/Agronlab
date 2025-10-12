import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabaseConfig';
import { useUser } from '../contexts/UserContext';

const ConversationScreen = ({ route, navigation }) => {
  const { inquiryId } = route.params;
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inquiry, setInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadConversation();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`conversation-${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        (payload) => {
          console.log('💬 New message received:', payload.new);
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [inquiryId]);

  const loadConversation = async () => {
    try {
      // Load inquiry details
      const { data: inquiryData, error: inquiryError } = await supabase
        .from('p2p_inquiries')
        .select(`
          *,
          p2p_products(name, category),
          buyer:users!p2p_inquiries_buyer_id_fkey(id, full_name, email, phone, profile_photo),
          seller:users!p2p_inquiries_seller_id_fkey(id, full_name, email, phone, profile_photo)
        `)
        .eq('id', inquiryId)
        .single();

      if (inquiryError) throw inquiryError;
      setInquiry(inquiryData);

      // Load messages
      await loadMessages();
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select(`
          *,
          sender:users!inquiry_messages_sender_id_fkey(id, full_name, profile_photo)
        `)
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('inquiry_messages')
        .update({ is_read: true })
        .eq('inquiry_id', inquiryId)
        .neq('sender_id', user.uid);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('inquiry_messages')
        .insert([{
          inquiry_id: inquiryId,
          sender_id: user.uid,
          message: newMessage.trim(),
          is_read: false,
        }]);

      if (error) throw error;

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.uid;
    const senderName = item.sender?.full_name || 'User';

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {item.sender?.profile_photo ? (
              <Image source={{ uri: item.sender.profile_photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={20} color="#4CAF50" />
              </View>
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          {!isMyMessage && <Text style={styles.senderName}>{senderName}</Text>}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  const otherUser =
    inquiry?.buyer_id === user.uid ? inquiry?.seller : inquiry?.buyer;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherUser?.full_name || 'User'}</Text>
          <Text style={styles.headerSubtitle}>
            {inquiry?.p2p_products?.name} • {inquiry?.quantity_needed} units
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="#2c5530" />
        </TouchableOpacity>
      </View>

      {/* Initial Inquiry Card */}
      <View style={styles.inquiryCard}>
        <View style={styles.inquiryHeader}>
          <MaterialIcons name="info-outline" size={20} color="#2196F3" />
          <Text style={styles.inquiryHeaderText}>Original Inquiry</Text>
        </View>
        <Text style={styles.inquiryMessage}>{inquiry?.message}</Text>
        <View style={styles.inquiryDetails}>
          <Text style={styles.inquiryDetail}>
            Quantity: {inquiry?.quantity_needed} units
          </Text>
          {inquiry?.buyer_location && (
            <Text style={styles.inquiryDetail}>Location: {inquiry?.buyer_location}</Text>
          )}
          <Text style={styles.inquiryDetail}>
            Status: {inquiry?.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <MaterialIcons name="chat-bubble-outline" size={48} color="#CCC" />
            <Text style={styles.emptyMessagesText}>No messages yet</Text>
            <Text style={styles.emptyMessagesHint}>Start the conversation below</Text>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inquiryCard: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  inquiryHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  inquiryMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  inquiryDetails: {
    gap: 4,
  },
  inquiryDetail: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  theirMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyMessagesHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});

export default ConversationScreen;


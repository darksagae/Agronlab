import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/data';
import { useUser } from '../contexts/UserContext';
import { sendEncryptedMessage, loadChatMessages, markMessageRead } from '../services/chatService';

let _rtClient = null;
function getRTClient() {
  if (!_rtClient) _rtClient = generateClient();
  return _rtClient;
}

const ConversationScreen = ({ route, navigation }) => {
  const { chatId, otherUserSub, otherUserName, productName } = route?.params || {};
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const listRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!user?.uid || !otherUserSub) return;
    const data = await loadChatMessages({ mySub: user.uid, otherSub: otherUserSub });
    setMessages(data);
    setLoading(false);

    // Mark incoming messages as read
    data.forEach((msg) => {
      if (msg.fromSub !== user.uid && !msg.readAt) {
        markMessageRead(msg.id);
      }
    });
  }, [user?.uid, otherUserSub]);

  useEffect(() => {
    loadMessages();

    // Real-time subscription for new messages in this chat thread
    let sub;
    try {
      sub = getRTClient()
        .models.ChatMessage.onCreate({
          filter: { chatId: { eq: chatId } },
        })
        .subscribe({
          next: () => {
            // A new message arrived — reload to decrypt it properly
            loadMessages();
          },
          error: () => {
            // AppSync subscription unavailable — fall back to polling
            const interval = setInterval(loadMessages, 8000);
            sub = { unsubscribe: () => clearInterval(interval) };
          },
        });
    } catch {
      // Subscription API not available in this Amplify version — use polling
      const interval = setInterval(loadMessages, 8000);
      sub = { unsubscribe: () => clearInterval(interval) };
    }

    return () => sub?.unsubscribe?.();
  }, [loadMessages, chatId]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !user?.uid || !otherUserSub) return;

    setSending(true);
    setNewMessage('');

    // Optimistic: show sent message immediately
    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      fromSub: user.uid,
      toSub: otherUserSub,
      text,
      decrypted: true,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const result = await sendEncryptedMessage({
        fromSub: user.uid,
        toSub: otherUserSub,
        plaintext: text,
      });

      if (!result.success) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        if (result.error === 'RECIPIENT_NO_KEY') {
          Alert.alert('Cannot Send', 'The recipient has not set up encrypted messaging yet.');
        } else {
          Alert.alert('Error', 'Failed to send message. Please try again.');
        }
      } else {
        // Replace optimistic with real message (keep text, update id)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? { ...m, id: result.message?.id || m.id, optimistic: false }
              : m
          )
        );
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.fromSub === user?.uid;
    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheirs]}>
        {!isMine && (
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={18} color="#4CAF50" />
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {!item.decrypted && item.fromSub !== user?.uid && (
            <View style={styles.encryptedRow}>
              <MaterialIcons name="lock" size={12} color={isMine ? 'rgba(255,255,255,0.7)' : '#aaa'} />
              <Text style={[styles.encryptedNote, isMine && styles.encryptedNoteMine]}>encrypted</Text>
            </View>
          )}
          <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextTheirs]}>
            {item.text}
          </Text>
          <View style={styles.msgMeta}>
            {isMine && (
              <MaterialIcons
                name="lock"
                size={10}
                color="rgba(255,255,255,0.6)"
                style={{ marginRight: 3 }}
              />
            )}
            <Text style={[styles.msgTime, isMine ? styles.msgTimeMine : styles.msgTimeTheirs]}>
              {timeStr}
            </Text>
            {item.optimistic && (
              <MaterialIcons name="schedule" size={10} color="rgba(255,255,255,0.6)" style={{ marginLeft: 3 }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading conversation…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{otherUserName || 'Farmer'}</Text>
            <View style={styles.e2eBadge}>
              <MaterialIcons name="lock" size={11} color="#4CAF50" />
              <Text style={styles.e2eText}>E2E</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>{productName || 'P2P Market'}</Text>
        </View>
        <TouchableOpacity onPress={loadMessages} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="refresh" size={22} color="#2c5530" />
        </TouchableOpacity>
      </View>

      {/* E2E notice (one-time banner) */}
      <View style={styles.encryptionBar}>
        <MaterialIcons name="lock" size={13} color="#2c5530" />
        <Text style={styles.encryptionBarText}>
          Messages are end-to-end encrypted · Only you and {otherUserName || 'the other party'} can read them
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="lock-outline" size={56} color="#DDD" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyHint}>Start the conversation below. Messages are encrypted.</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="send" size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ConversationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' },
  loadingText: { marginTop: 12, color: '#666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 3,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#2c5530' },
  e2eBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  e2eText: { fontSize: 10, fontWeight: '700', color: '#4CAF50' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  encryptionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
  },
  encryptionBarText: { fontSize: 11, color: '#2c5530', flex: 1 },
  list: { padding: 12, paddingBottom: 6 },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '82%',
  },
  msgRowMine: { alignSelf: 'flex-end' },
  msgRowTheirs: { alignSelf: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    alignSelf: 'flex-end',
  },
  bubble: { padding: 10, borderRadius: 16, maxWidth: '100%' },
  bubbleMine: { backgroundColor: '#4CAF50', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: 'white', borderBottomLeftRadius: 4, elevation: 1 },
  encryptedRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  encryptedNote: { fontSize: 10, color: '#bbb', fontStyle: 'italic' },
  encryptedNoteMine: { color: 'rgba(255,255,255,0.6)' },
  msgText: { fontSize: 15, lineHeight: 21 },
  msgTextMine: { color: 'white' },
  msgTextTheirs: { color: '#222' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  msgTime: { fontSize: 10 },
  msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
  msgTimeTheirs: { color: '#aaa' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#bbb', marginTop: 16 },
  emptyHint: { fontSize: 13, color: '#ccc', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendBtnDisabled: { opacity: 0.45 },
});

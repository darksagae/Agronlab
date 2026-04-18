import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { listMyChats, fetchMerchantProfile } from '../services/chatService';

const MessagesInboxScreen = ({ navigation }) => {
  const { user } = useUser();
  const [threads, setThreads] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!user?.uid) return;
    const chats = await listMyChats(user.uid);
    setThreads(chats);

    // Fetch display names for each unique other user
    const uniqueSubs = [...new Set(chats.map((c) => c.otherSub))];
    const profileEntries = await Promise.all(
      uniqueSubs.map(async (sub) => {
        const p = await fetchMerchantProfile(sub);
        return [sub, p];
      })
    );
    setProfiles(Object.fromEntries(profileEntries));
    setLoading(false);
    setRefreshing(false);
  }, [user?.uid]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const onRefresh = () => {
    setRefreshing(true);
    loadThreads();
  };

  const openChat = (thread) => {
    const profile = profiles[thread.otherSub];
    navigation.navigate('Conversation', {
      chatId: thread.chatId,
      otherUserSub: thread.otherSub,
      otherUserName: profile?.displayName || 'Farmer',
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderThread = ({ item }) => {
    const profile = profiles[item.otherSub];
    const name = profile?.displayName || 'Farmer';
    const initials = name.slice(0, 2).toUpperCase();

    return (
      <TouchableOpacity style={styles.row} onPress={() => openChat(item)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
          {item.hasUnread && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, item.hasUnread && styles.nameBold]}>{name}</Text>
            <Text style={styles.time}>{formatTime(item.latestAt)}</Text>
          </View>
          <View style={styles.rowBottom}>
            <MaterialIcons name="lock" size={11} color="#aaa" style={{ marginRight: 3 }} />
            <Text style={styles.preview}>Encrypted message</Text>
            {item.hasUnread && <View style={styles.badge} />}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.e2eBadge}>
          <MaterialIcons name="lock" size={11} color="#4CAF50" />
          <Text style={styles.e2eText}>E2E</Text>
        </View>
      </View>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.chatId}
        renderItem={renderThread}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
        contentContainerStyle={threads.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="chat-bubble-outline" size={64} color="#DDD" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyHint}>
              Start a conversation by contacting a seller from the P2P market.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MessagesInboxScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 3,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#2c5530' },
  e2eBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  e2eText: { fontSize: 10, fontWeight: '700', color: '#4CAF50' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#4CAF50' },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 15, color: '#222' },
  nameBold: { fontWeight: '700' },
  time: { fontSize: 12, color: '#aaa' },
  rowBottom: { flexDirection: 'row', alignItems: 'center' },
  preview: { fontSize: 13, color: '#aaa', fontStyle: 'italic', flex: 1 },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 4,
  },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#bbb', marginTop: 16 },
  emptyHint: { fontSize: 13, color: '#ccc', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});

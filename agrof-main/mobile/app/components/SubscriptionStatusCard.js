import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionStatusCard = ({ onSubscribe }) => {
  const { isSubscribed, subscription, loading } = useSubscription();

  if (loading) return null;

  if (isSubscribed) {
    const expiresAt = subscription?.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
    return (
      <View style={styles.section}>
        <View style={styles.activeCard}>
          <View style={styles.activeIcon}>
            <MaterialIcons name="star" size={22} color="#FF9800" />
          </View>
          <View style={styles.info}>
            <Text style={styles.activeTitle}>AGRON Premium</Text>
            <Text style={styles.activeSub}>Active · expires {expiresAt}</Text>
          </View>
          <MaterialIcons name="verified" size={22} color="#4CAF50" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.freeCard}>
        <View style={styles.freeHeader}>
          <MaterialIcons name="star-border" size={22} color="#FF9800" />
          <Text style={styles.freeTitle}>Free Plan</Text>
        </View>
        <Text style={styles.freeText}>
          Upgrade to Premium for $10/year — unlock P2P selling, international market access, and advanced AI.
        </Text>
        <TouchableOpacity style={styles.upgradeBtn} onPress={onSubscribe}>
          <MaterialIcons name="arrow-upward" size={16} color="white" />
          <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SubscriptionStatusCard;

const styles = StyleSheet.create({
  section: { paddingHorizontal: 15, marginTop: 8, marginBottom: 4 },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  activeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  activeTitle: { fontSize: 15, fontWeight: '700', color: '#2c5530' },
  activeSub: { fontSize: 12, color: '#558B2F', marginTop: 2 },
  freeCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
    elevation: 1,
  },
  freeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  freeTitle: { fontSize: 15, fontWeight: '700', color: '#E65100' },
  freeText: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 14 },
  upgradeBtn: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
  },
  upgradeBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
});

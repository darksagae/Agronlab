import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listActiveListings } from '../services/p2pService';
import { useUser } from '../contexts/UserContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const cropImages = {
  Maize: require('../assets/crops/maize.png'),
  Rice: require('../assets/crops/rice.png'),
  Millet: require('../assets/crops/millet.png'),
  Beans: require('../assets/crops/beans.png'),
  Groundnuts: require('../assets/crops/groundnuts.png'),
  Soyabeans: require('../assets/crops/soyabeans.png'),
  Coffee: require('../assets/crops/coffee.png'),
  Cotton: require('../assets/crops/cotton.png'),
  Sugarcane: require('../assets/crops/sugarcane.png'),
  Tomatoes: require('../assets/crops/tomatoes.png'),
  Cabbage: require('../assets/crops/cabbage.png'),
  Onions: require('../assets/crops/onions.png'),
  Carrot: require('../assets/crops/carrot.png'),
  Spinach: require('../assets/crops/spinach.png'),
  Avocados: require('../assets/crops/avocados.png'),
  Banana: require('../assets/crops/banana.png'),
  Mangoes: require('../assets/crops/mangoes.png'),
  Orangoes: require('../assets/crops/orangoes.png'),
  Pineapple: require('../assets/crops/pineapple.png'),
};

const CATEGORY_COLORS = {
  Grains: '#4CAF50',
  Legumes: '#8BC34A',
  'Cash Crops': '#FF9800',
  Vegetables: '#00BCD4',
  Fruits: '#E91E63',
  Other: '#9E9E9E',
};

const ListingCard = ({ listing, onInquire }) => {
  const img = cropImages[listing.title];
  const accent = CATEGORY_COLORS[listing.category] ?? CATEGORY_COLORS.Other;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onInquire(listing)}>
      <View style={[styles.cardImageWrap, { backgroundColor: `${accent}18` }]}>
        {img ? (
          <Image source={img} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <MaterialIcons name="eco" size={38} color={accent} />
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>{listing.title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: `${accent}22` }]}>
            <Text style={[styles.categoryBadgeText, { color: accent }]}>{listing.category || 'Other'}</Text>
          </View>
        </View>

        <Text style={styles.cardPrice}>{listing.priceLabel ?? '—'}</Text>

        {listing.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{listing.description}</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.sellerRow}>
            <MaterialIcons name="person" size={14} color="#888" />
            <Text style={styles.sellerName}>{listing.sellerName || 'Farmer'}</Text>
          </View>
          <TouchableOpacity style={styles.inquireBtn} onPress={() => onInquire(listing)}>
            <MaterialIcons name="chat" size={14} color="#4CAF50" />
            <Text style={styles.inquireBtnText}>Inquire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const P2PProductsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { isSubscribed } = useSubscription();
  const [allListings, setAllListings] = useState([]);
  const [showInternational, setShowInternational] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const listings = showInternational
    ? allListings
    : allListings.filter((l) => !l.isInternational);

  const load = useCallback(async () => {
    const data = await listActiveListings();
    setAllListings(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleInquire = (listing) => {
    if (!navigation) return;
    navigation.navigate('InquiryForm', {
      listing,
      seller: {
        uid: listing.sellerSub,
        id: listing.sellerSub,
        fullName: listing.sellerName || 'Farmer',
      },
      p2pProduct: { id: listing.id, name: listing.title },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading P2P Market…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>P2P Market</Text>
          <Text style={styles.headerSub}>Direct trade with verified farmers</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Info strip */}
      <View style={styles.strip}>
        <MaterialIcons name="info-outline" size={16} color="#1976D2" />
        <Text style={styles.stripText}>Browse freely · Sign in to inquire · Prices negotiable</Text>
      </View>

      {/* International toggle */}
      <View style={styles.intlBar}>
        <MaterialIcons name="public" size={16} color={showInternational ? '#4CAF50' : '#aaa'} />
        <Text style={styles.intlLabel}>International listings</Text>
        <TouchableOpacity
          style={[styles.intlToggle, showInternational && styles.intlToggleOn]}
          onPress={() => {
            if (!isSubscribed && !showInternational) {
              Alert.alert(
                'Subscription Required',
                'International listings are visible to AGRON Premium subscribers ($10/year).',
                [
                  { text: 'Subscribe', onPress: () => navigation?.navigate?.('Payment') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
              return;
            }
            setShowInternational((v) => !v);
          }}
        >
          {!isSubscribed ? (
            <MaterialIcons name="lock" size={14} color="#aaa" />
          ) : (
            <Text style={[styles.intlToggleText, showInternational && styles.intlToggleTextOn]}>
              {showInternational ? 'ON' : 'OFF'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} onInquire={handleInquire} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="grass" size={72} color="#DDD" />
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyText}>
              Be the first to post! Head to your Account tab → P2P Market → Add Listing.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={18} color="white" />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default P2PProductsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#2c5530' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  stripText: { fontSize: 12, color: '#1976D2', flex: 1 },
  intlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  intlLabel: { flex: 1, fontSize: 13, color: '#555' },
  intlToggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intlToggleOn: { backgroundColor: '#4CAF50' },
  intlToggleText: { fontSize: 11, fontWeight: '700', color: '#888' },
  intlToggleTextOn: { color: 'white' },
  list: { padding: 16, paddingBottom: 60 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImageWrap: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardImage: { width: 80, height: 80, borderRadius: 8 },
  cardBody: { flex: 1, padding: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#222', flex: 1, marginRight: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryBadgeText: { fontSize: 10, fontWeight: '700' },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#2c5530', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#777', lineHeight: 17, marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerName: { fontSize: 12, color: '#888' },
  inquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  inquireBtnText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#555', marginTop: 20, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  refreshBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
});

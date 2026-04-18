import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { listMyListings, updateListingStatus, deleteListing } from '../services/p2pService';

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

const ListingCard = ({ listing, onToggle, onDelete }) => {
  const img = cropImages[listing.title];
  const isActive = listing.status === 'ACTIVE';

  return (
    <View style={styles.listingCard}>
      <View style={styles.listingRow}>
        <View style={styles.listingImageWrap}>
          {img ? (
            <Image source={img} style={styles.listingImage} resizeMode="cover" />
          ) : (
            <MaterialIcons name="eco" size={32} color="#4CAF50" />
          )}
        </View>

        <View style={styles.listingInfo}>
          <View style={styles.listingTitleRow}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#4CAF50' : '#FF9800' }]} />
          </View>
          <Text style={styles.listingPrice}>{listing.priceLabel ?? '—'}</Text>
          {listing.category ? (
            <Text style={styles.listingCategory}>{listing.category}</Text>
          ) : null}
          {listing.description ? (
            <Text style={styles.listingDesc} numberOfLines={2}>{listing.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.listingActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onToggle(listing)}>
          <MaterialIcons name={isActive ? 'pause' : 'play-arrow'} size={17} color="#2196F3" />
          <Text style={styles.actionBtnText}>{isActive ? 'Pause' : 'Activate'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(listing)}>
          <MaterialIcons name="delete-outline" size={17} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const P2PMarketPanel = ({ navigation }) => {
  const { user } = useUser();
  const { isSubscribed } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);

  const load = useCallback(async () => {
    if (!user?.uid) { setLoading(false); return; }
    const data = await listMyListings(user.uid);
    setListings(data);
    setLoading(false);
    setRefreshing(false);
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const activeCount = listings.filter((l) => l.status === 'ACTIVE').length;

  const handleToggle = async (listing) => {
    const next = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const result = await updateListingStatus(listing.id, next);
    if (result.success) {
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, status: next } : l));
    } else {
      Alert.alert('Error', result.error || 'Could not update listing.');
    }
  };

  const handleDelete = (listing) => {
    Alert.alert(
      'Delete Listing',
      `Remove "${listing.title}" from the market?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteListing(listing.id);
            if (result.success) {
              setListings((prev) => prev.filter((l) => l.id !== listing.id));
            } else {
              Alert.alert('Error', result.error || 'Could not delete listing.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your P2P panel…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={22} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My P2P Market</Text>
        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="refresh" size={22} color="#2c5530" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="inventory" size={22} color="#4CAF50" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="list-alt" size={22} color="#2196F3" />
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="pause-circle-outline" size={22} color="#FF9800" />
            <Text style={styles.statValue}>{listings.length - activeCount}</Text>
            <Text style={styles.statLabel}>Paused</Text>
          </View>
        </View>

        {/* Subscription gate for selling */}
        {!isSubscribed && (
          <View style={styles.subGate}>
            <MaterialIcons name="lock" size={20} color="#FF9800" />
            <View style={{ flex: 1 }}>
              <Text style={styles.subGateTitle}>Selling requires a subscription</Text>
              <Text style={styles.subGateHint}>Subscribe for $10/year to post listings on the P2P market</Text>
            </View>
            <TouchableOpacity
              style={styles.subGateBtn}
              onPress={() => navigation.navigate('Payment')}
            >
              <Text style={styles.subGateBtnText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add listing CTA */}
        <TouchableOpacity
          style={[styles.addBtn, !isSubscribed && styles.addBtnLocked]}
          onPress={() => {
            if (!isSubscribed) {
              Alert.alert(
                'Subscription Required',
                'You need an active AGRON subscription ($10/year) to post listings.',
                [
                  { text: 'Subscribe Now', onPress: () => navigation.navigate('Payment') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
              return;
            }
            navigation.navigate('ProductSelection');
          }}
        >
          <MaterialIcons name={isSubscribed ? 'add-circle' : 'lock'} size={22} color="white" />
          <Text style={styles.addBtnText}>{isSubscribed ? 'Add New Listing' : 'Subscribe to Sell'}</Text>
        </TouchableOpacity>

        {/* Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings ({listings.length})</Text>

          {listings.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="inventory-2" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No listings yet</Text>
              <Text style={styles.emptyHint}>Tap "Add New Listing" to start selling on the P2P market</Text>
            </View>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>

        {/* Portal banner */}
        <TouchableOpacity
          style={styles.portalBanner}
          onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_PORTAL_URL || 'https://portal.agron.uk')}
        >
          <MaterialIcons name="open-in-browser" size={20} color="white" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.portalTitle}>Manage store on the web</Text>
            <Text style={styles.portalSub}>Full dashboard & encrypted chat — AGRON Portal</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={14} color="white" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default P2PMarketPanel;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 10, fontSize: 15, color: '#666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#2c5530' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#333', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 3 },
  subGate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  subGateTitle: { fontSize: 13, fontWeight: '700', color: '#E65100' },
  subGateHint: { fontSize: 11, color: '#BF360C', marginTop: 2 },
  subGateBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  subGateBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    elevation: 2,
  },
  addBtnLocked: { backgroundColor: '#9E9E9E' },
  addBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2c5530', marginBottom: 12 },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 1,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#777', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#aaa', marginTop: 6, textAlign: 'center' },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  listingRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  listingImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  listingImage: { width: '100%', height: '100%' },
  listingInfo: { flex: 1 },
  listingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  listingTitle: { fontSize: 15, fontWeight: '700', color: '#333', flex: 1 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  listingPrice: { fontSize: 14, fontWeight: '700', color: '#2c5530', marginBottom: 2 },
  listingCategory: { fontSize: 11, color: '#888', marginBottom: 2 },
  listingDesc: { fontSize: 12, color: '#666', lineHeight: 17 },
  listingActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 5,
  },
  actionBtnText: { fontSize: 12, color: '#2196F3', fontWeight: '600' },
  portalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5530',
    margin: 16,
    borderRadius: 12,
    padding: 14,
  },
  portalTitle: { color: 'white', fontWeight: '700', fontSize: 13 },
  portalSub: { color: '#a5d6a7', fontSize: 11, marginTop: 2 },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchRegisteredStores } from '../services/storeRegistryService';

const { width } = Dimensions.get('window');

// ─── Agron built-in store icon (always first) ────────────────────────────────

const AgronStoreIcon = ({ onPress }) => {
  const dropAnim = useRef(new Animated.Value(-60)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dropAnim, {
      toValue: 0,
      duration: 900,
      useNativeDriver: true,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    });
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bounceY = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });

  return (
    <TouchableOpacity style={styles.storeItem} onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={{ transform: [{ translateY: dropAnim }, { translateY: bounceY }] }}>
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
        <View style={[styles.iconCircle, styles.agronCircle]}>
          <Image source={require('../assets/logo.png')} style={styles.agronLogo} resizeMode="contain" />
        </View>
      </Animated.View>
      <Text style={styles.storeName}>Agron Store</Text>
      <Text style={styles.storeTagline}>AI crop supply partner</Text>
    </TouchableOpacity>
  );
};

// ─── Dynamic merchant store icon ─────────────────────────────────────────────

const MerchantStoreIcon = ({ store, index, onPress }) => {
  const dropAnim = useRef(new Animated.Value(-60)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = 200 + index * 150;
    const timer = setTimeout(() => {
      Animated.timing(dropAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: 1, duration: 900 + index * 80, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 900 + index * 80, useNativeDriver: true }),
          ])
        ).start();
      });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const bounceY = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const initials = (store.name ?? '??').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={styles.storeItem} onPress={() => onPress(store)} activeOpacity={0.85}>
      <Animated.View style={{ transform: [{ translateY: dropAnim }, { translateY: bounceY }] }}>
        <View style={[styles.iconCircle, styles.merchantCircle]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      </Animated.View>
      <Text style={styles.storeName} numberOfLines={2}>{store.name}</Text>
      {store.tagline ? (
        <Text style={styles.storeTagline} numberOfLines={1}>{store.tagline}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const StoreDirectoryLanding = ({ onAgronPress, onMerchantStorePress }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegisteredStores()
      .then(setStores)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.headline}>Browse Stores</Text>
          <Text style={styles.sub}>Tap a store to explore their products</Text>
        </View>

        {/* Store icon row */}
        <View style={styles.gridWrap}>
          {/* Agron — always first */}
          <AgronStoreIcon onPress={onAgronPress} />

          {/* Dynamic stores from AppSync */}
          {loading ? (
            <View style={styles.loadingItem}>
              <ActivityIndicator color="#22c55e" />
            </View>
          ) : (
            stores.map((store, i) => (
              <MerchantStoreIcon
                key={store.id}
                store={store}
                index={i}
                onPress={onMerchantStorePress}
              />
            ))
          )}
        </View>

        {/* Footer hint */}
        <View style={styles.footerHint}>
          <Text style={styles.footerText}>
            Want your store here?{'\n'}
            Register at{' '}
            <Text style={styles.footerLink}>portal.agron.uk</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreDirectoryLanding;

const ICON_SIZE = 80;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: '#737373',
    marginTop: 6,
    textAlign: 'center',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 20,
  },
  storeItem: {
    width: (width - 72) / 3,
    alignItems: 'center',
    marginBottom: 8,
  },
  glowRing: {
    position: 'absolute',
    width: ICON_SIZE + 18,
    height: ICON_SIZE + 18,
    borderRadius: (ICON_SIZE + 18) / 2,
    backgroundColor: '#16a34a',
    top: -9,
    left: -9,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  agronCircle: {
    backgroundColor: '#052e16',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  merchantCircle: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#1e3a5f',
  },
  agronLogo: {
    width: 52,
    height: 52,
  },
  initials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 1,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  storeTagline: {
    fontSize: 10,
    color: '#525252',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  loadingItem: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 40,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2a1a',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#22c55e',
    fontWeight: '700',
  },
});

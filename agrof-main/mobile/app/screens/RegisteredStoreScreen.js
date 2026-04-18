import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchStoreProducts } from '../services/storeRegistryService';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 60) / 2;

const ProductTile = ({ product, onPress }) => (
  <TouchableOpacity style={styles.tile} onPress={() => onPress && onPress(product)} activeOpacity={0.8}>
    <View style={styles.tileImagePlaceholder}>
      <MaterialIcons name="inventory-2" size={40} color="#22c55e" />
    </View>
    <Text style={styles.tileName} numberOfLines={2}>{product.name}</Text>
    {product.priceLabel ? (
      <Text style={styles.tilePrice}>{product.priceLabel}</Text>
    ) : null}
    {product.description ? (
      <Text style={styles.tileSub} numberOfLines={2}>{product.description}</Text>
    ) : null}
    {product.unit ? (
      <Text style={styles.tileUnit}>per {product.unit}</Text>
    ) : null}
  </TouchableOpacity>
);

const RegisteredStoreScreen = ({ store, onBack }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) {
      setLoading(false);
      return;
    }
    fetchStoreProducts(store.id, { inStockOnly: false })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [store?.id]);

  const initials = (store?.name ?? '??').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store?.name ?? 'Store'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store hero */}
        <View style={styles.heroBlock}>
          <View style={styles.storeIconCircle}>
            <Text style={styles.storeInitials}>{initials}</Text>
          </View>
          <Text style={styles.storeName}>{store?.name}</Text>
          {store?.tagline ? (
            <Text style={styles.storeTagline}>{store.tagline}</Text>
          ) : null}
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>Products</Text>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#22c55e" size="large" />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="inventory" size={48} color="#262626" />
              <Text style={styles.emptyText}>No products listed yet.</Text>
              <Text style={styles.emptyHint}>Check back soon.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map((p) => (
                <ProductTile key={p.id} product={p} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisteredStoreScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f1f1f',
  },
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  heroBlock: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a1a',
  },
  storeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  storeInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 1,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  storeTagline: {
    fontSize: 13,
    color: '#737373',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  sectionKicker: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525252',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  tile: {
    width: GRID_ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: 28,
  },
  tileImagePlaceholder: {
    width: '100%',
    height: 130,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#0a1f0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 19,
  },
  tilePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22c55e',
    textAlign: 'center',
    marginTop: 4,
  },
  tileSub: {
    fontSize: 11,
    color: '#737373',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
  tileUnit: {
    fontSize: 10,
    color: '#404040',
    textAlign: 'center',
    marginTop: 2,
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#525252',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#404040',
    fontSize: 13,
  },
});

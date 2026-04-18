import React, { useEffect, useRef } from 'react';
import {
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
import { MaterialIcons } from '@expo/vector-icons';
import { AGRON_CATEGORIES, PRICE_NOTE, getAgronProductsByCategory } from '../data/agronCatalog';

const MARQUEE_TEXT =
  'Fresh from Kampala market  ·  NARO certified varieties  ·  Agron Assured Quality  ·  Best prices guaranteed  ·  NAADS registered inputs  ·  Same-day availability  ·  ';

const MarqueeBanner = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const TILE = 1800;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: -TILE,
        duration: 14000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={marqueeStyles.wrap}>
      <Animated.View
        style={[marqueeStyles.row, { transform: [{ translateX: anim }] }]}
      >
        {[0, 1, 2].map((i) => (
          <Text key={i} style={marqueeStyles.text} numberOfLines={1}>
            {MARQUEE_TEXT}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

const marqueeStyles = StyleSheet.create({
  wrap: {
    height: 30,
    overflow: 'hidden',
    backgroundColor: '#052e16',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#14532d',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    letterSpacing: 0.3,
    paddingHorizontal: 4,
    width: 1800,
  },
});

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 60) / 2;

const ProductTile = ({ product, onPress }) => (
  <TouchableOpacity style={styles.tile} onPress={() => onPress(product)} activeOpacity={0.8}>
    <Image source={product.listImage} style={styles.tileImage} resizeMode="cover" />
    <Text style={styles.tileName} numberOfLines={2}>{product.name}</Text>
    <Text style={styles.tilePrice}>From {product.price}</Text>
    <Text style={styles.tileSub} numberOfLines={2}>{product.subtitle}</Text>
  </TouchableOpacity>
);

const AgronCategoryScreen = ({ categorySlug, onBack, onProductPress }) => {
  const categoryMeta = AGRON_CATEGORIES.find((c) => c.id === categorySlug);
  const products = getAgronProductsByCategory(categorySlug);
  const title = categoryMeta?.name ?? 'Category';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backBtn} />
      </View>

      <MarqueeBanner />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>Shop by model</Text>

          {products.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No products in this category yet.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map((product) => (
                <ProductTile key={product.id} product={product} onPress={onProductPress} />
              ))}
            </View>
          )}

          <Text style={styles.footnote}>{PRICE_NOTE}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AgronCategoryScreen;

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
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
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
  tileImage: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#0a1f0d',
  },
  tileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  tilePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
    textAlign: 'center',
    marginTop: 5,
  },
  tileSub: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 17,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#525252',
    fontSize: 15,
    textAlign: 'center',
  },
  footnote: {
    color: '#404040',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

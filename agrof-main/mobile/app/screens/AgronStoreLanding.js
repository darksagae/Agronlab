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
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AGRON_CATEGORIES } from '../data/agronCatalog';

const { width } = Dimensions.get('window');

const CategoryItem = ({ category, onPress }) => (
  <TouchableOpacity
    style={styles.categoryItem}
    onPress={() => onPress(category.id)}
    activeOpacity={0.8}
  >
    <View style={styles.categoryImageWrap}>
      <Image source={category.image} style={styles.categoryImage} resizeMode="cover" />
      <View style={styles.categoryOverlay} />
    </View>
    <Text style={styles.categoryName}>{category.name}</Text>
  </TouchableOpacity>
);

const AgronStoreLanding = ({ onCategoryPress, onBack }) => {
  const logoAnimation = useRef(new Animated.Value(-200)).current;
  const logoBounce = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoAnimation, {
      toValue: 0,
      duration: 1800,
      useNativeDriver: true,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoBounce, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(logoBounce, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bounceY = logoBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <SafeAreaView style={styles.container}>
      {onBack && (
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Agron Store</Text>
          <View style={{ width: 20 }} />
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero / Logo */}
        <View style={styles.heroContainer}>
          <Animated.View
            style={[
              styles.logoWrapper,
              { transform: [{ translateY: logoAnimation }, { translateY: bounceY }] },
            ]}
          >
            <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          <Text style={styles.heroTitle}>Agron Store</Text>
          <Text style={styles.heroSub}>Your AI-powered crop supply partner</Text>
        </View>

        {/* Category Grid */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.grid}>
            {AGRON_CATEGORIES.map((cat) => (
              <CategoryItem key={cat.id} category={cat} onPress={onCategoryPress} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AgronStoreLanding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f1f1f',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#16a34a',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#22c55e',
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginTop: 6,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#737373',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  categoryItem: {
    width: (width - 60) / 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryImageWrap: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#0a1f0d',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';

const CATALOG = [
  // Grains
  { id: 'maize', name: 'Maize', category: 'Grains', unit: 'kg', image: require('../assets/crops/maize.png') },
  { id: 'rice', name: 'Rice', category: 'Grains', unit: 'kg', image: require('../assets/crops/rice.png') },
  { id: 'millet', name: 'Millet', category: 'Grains', unit: 'kg', image: require('../assets/crops/millet.png') },
  // Legumes
  { id: 'beans', name: 'Beans', category: 'Legumes', unit: 'kg', image: require('../assets/crops/beans.png') },
  { id: 'groundnuts', name: 'Groundnuts', category: 'Legumes', unit: 'kg', image: require('../assets/crops/groundnuts.png') },
  { id: 'soyabeans', name: 'Soyabeans', category: 'Legumes', unit: 'kg', image: require('../assets/crops/soyabeans.png') },
  // Cash Crops
  { id: 'coffee', name: 'Coffee', category: 'Cash Crops', unit: 'kg', image: require('../assets/crops/coffee.png') },
  { id: 'cotton', name: 'Cotton', category: 'Cash Crops', unit: 'kg', image: require('../assets/crops/cotton.png') },
  { id: 'sugarcane', name: 'Sugarcane', category: 'Cash Crops', unit: 'tonne', image: require('../assets/crops/sugarcane.png') },
  // Vegetables
  { id: 'tomatoes', name: 'Tomatoes', category: 'Vegetables', unit: 'crate', image: require('../assets/crops/tomatoes.png') },
  { id: 'cabbage', name: 'Cabbage', category: 'Vegetables', unit: 'head', image: require('../assets/crops/cabbage.png') },
  { id: 'onions', name: 'Onions', category: 'Vegetables', unit: 'kg', image: require('../assets/crops/onions.png') },
  { id: 'carrot', name: 'Carrot', category: 'Vegetables', unit: 'kg', image: require('../assets/crops/carrot.png') },
  { id: 'spinach', name: 'Spinach', category: 'Vegetables', unit: 'bundle', image: require('../assets/crops/spinach.png') },
  // Fruits
  { id: 'avocados', name: 'Avocados', category: 'Fruits', unit: 'piece', image: require('../assets/crops/avocados.png') },
  { id: 'banana', name: 'Banana', category: 'Fruits', unit: 'bunch', image: require('../assets/crops/banana.png') },
  { id: 'mangoes', name: 'Mangoes', category: 'Fruits', unit: 'kg', image: require('../assets/crops/mangoes.png') },
  { id: 'orangoes', name: 'Orangoes', category: 'Fruits', unit: 'kg', image: require('../assets/crops/orangoes.png') },
  { id: 'pineapple', name: 'Pineapple', category: 'Fruits', unit: 'piece', image: require('../assets/crops/pineapple.png') },
];

const CATEGORIES = ['Grains', 'Legumes', 'Cash Crops', 'Vegetables', 'Fruits'];

const CATEGORY_COLORS = {
  Grains: '#4CAF50',
  Legumes: '#8BC34A',
  'Cash Crops': '#FF9800',
  Vegetables: '#00BCD4',
  Fruits: '#E91E63',
};

const ProductSelectionScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const [selected, setSelected] = useState([]);

  const toggle = (product) => {
    setSelected((prev) =>
      prev.find((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const isSelected = (id) => selected.some((p) => p.id === id);

  const handleContinue = () => {
    if (selected.length === 0) {
      Alert.alert('No Products Selected', 'Please select at least one crop to list.');
      return;
    }
    navigation.navigate('PriceQuantityInput', {
      selectedProducts: selected,
      sellerId: user?.uid,
      sellerName: user?.fullName || user?.username || 'Farmer',
    });
  };

  const productsByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    items: CATALOG.filter((p) => p.category === cat),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={22} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Crops to Sell</Text>
        <View style={styles.selectedBadgeWrap}>
          {selected.length > 0 && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selected.length}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.hint}>Select the crops you want to list on the P2P market.</Text>

        {productsByCategory.map(({ category, items }) => (
          <View key={category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
              <Text style={styles.sectionTitle}>{category}</Text>
            </View>

            <View style={styles.grid}>
              {items.map((product) => {
                const sel = isSelected(product.id);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, sel && styles.productCardSelected]}
                    onPress={() => toggle(product)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.imageWrap, sel && { borderColor: CATEGORY_COLORS[category] }]}>
                      <Image source={product.image} style={styles.productImage} resizeMode="cover" />
                      {sel && (
                        <View style={styles.checkOverlay}>
                          <MaterialIcons name="check-circle" size={24} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.productName, sel && { color: CATEGORY_COLORS[category] }]}>
                      {product.name}
                    </Text>
                    <Text style={styles.productUnit}>per {product.unit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, selected.length === 0 && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={selected.length === 0}
        >
          <Text style={styles.continueBtnText}>
            {selected.length === 0 ? 'Select crops to continue' : `Continue with ${selected.length} crop${selected.length > 1 ? 's' : ''}`}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductSelectionScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
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
  selectedBadgeWrap: { width: 30, alignItems: 'flex-end' },
  selectedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  selectedBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  scrollContent: { paddingBottom: 16 },
  hint: { fontSize: 13, color: '#888', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
    elevation: 3,
  },
  imageWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76,175,80,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: 12, fontWeight: '700', color: '#333', textAlign: 'center' },
  productUnit: { fontSize: 10, color: '#aaa', marginTop: 2 },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  continueBtnDisabled: { backgroundColor: '#BDBDBD' },
  continueBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createListing } from '../services/p2pService';

const PriceQuantityInputScreen = ({ route, navigation }) => {
  const { selectedProducts = [], sellerId, sellerName = 'Farmer' } = route?.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [pricing, setPricing] = useState(
    selectedProducts.map((p) => ({
      askingPrice: '',
      quantity: '',
      minOrder: '1',
      location: 'Kampala',
      notes: '',
    }))
  );

  const current = selectedProducts[currentIndex];
  const currentP = pricing[currentIndex];

  const update = (field, value) => {
    setPricing((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], [field]: value };
      return next;
    });
  };

  const handleNext = () => {
    if (!currentP.askingPrice || parseFloat(currentP.askingPrice) <= 0) {
      Alert.alert('Price Required', 'Please enter a valid selling price.');
      return;
    }
    if (!currentP.quantity || parseInt(currentP.quantity) <= 0) {
      Alert.alert('Quantity Required', 'Please enter how much you have available.');
      return;
    }
    if (currentIndex < selectedProducts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmitAll();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      const p = pricing[i];
      const qty = parseInt(p.quantity);
      const price = parseFloat(p.askingPrice);

      const priceLabel = `UGX ${Math.round(price).toLocaleString()} / ${product.unit}  •  Qty: ${qty}${p.location ? `  •  ${p.location}` : ''}`;

      const description = [
        p.notes,
        p.minOrder && parseInt(p.minOrder) > 1 ? `Min order: ${p.minOrder} ${product.unit}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const result = await createListing({
        title: product.name,
        description,
        category: product.category,
        priceLabel,
        unit: product.unit,
        sellerSub: sellerId,
        sellerName,
      });

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to create listing for ${product.name}:`, result.error);
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      Alert.alert(
        successCount === selectedProducts.length ? '🎉 Listings Published!' : '⚠️ Partially Published',
        failCount === 0
          ? `${successCount} listing${successCount > 1 ? 's' : ''} are now live on the P2P market.`
          : `${successCount} published, ${failCount} failed. Check your connection and try again.`,
        [{ text: 'Done', onPress: () => navigation.navigate('P2PMarketPanel') }]
      );
    } else {
      Alert.alert('Error', 'Failed to publish listings. Please check your connection and try again.');
    }
  };

  if (selectedProducts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No products selected.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="arrow-back" size={22} color="#2c5530" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Price & Quantity</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Progress */}
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>
              Crop {currentIndex + 1} of {selectedProducts.length}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentIndex + 1) / selectedProducts.length) * 100}%` }]} />
            </View>
          </View>

          {/* Crop info */}
          <View style={styles.cropCard}>
            {current.image ? (
              <Image source={current.image} style={styles.cropImage} resizeMode="cover" />
            ) : (
              <MaterialIcons name="eco" size={40} color="#4CAF50" />
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.cropName}>{current.name}</Text>
              <Text style={styles.cropMeta}>{current.category}  •  per {current.unit}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Price */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Selling Price *</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>UGX</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="e.g. 2500"
                  value={currentP.askingPrice}
                  onChangeText={(v) => update('askingPrice', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.hint}>Price per {current.unit}</Text>
            </View>

            {/* Quantity */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Quantity Available *</Text>
              <TextInput
                style={styles.input}
                placeholder={`e.g. 500 ${current.unit}`}
                value={currentP.quantity}
                onChangeText={(v) => update('quantity', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>How many {current.unit} you have to sell</Text>
            </View>

            {/* Min order */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Minimum Order</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={currentP.minOrder}
                onChangeText={(v) => update('minOrder', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Minimum {current.unit} a buyer must order</Text>
            </View>

            {/* Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Kampala, Mbale, Gulu"
                value={currentP.location}
                onChangeText={(v) => update('location', v)}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Organic, fresh harvest, delivery available…"
                value={currentP.notes}
                onChangeText={(v) => update('notes', v)}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Preview */}
            {currentP.askingPrice && currentP.quantity ? (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Listing preview:</Text>
                <Text style={styles.previewText}>
                  UGX {parseInt(currentP.askingPrice || '0').toLocaleString()} / {current.unit}  •  Qty: {currentP.quantity}{currentP.location ? `  •  ${currentP.location}` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Footer nav */}
        <View style={styles.footer}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.prevBtn} onPress={handlePrevious}>
              <MaterialIcons name="arrow-back" size={18} color="#4CAF50" />
              <Text style={styles.prevBtnText}>Prev</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, currentIndex === 0 && { flex: 1 }]}
            onPress={handleNext}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>
                  {currentIndex === selectedProducts.length - 1 ? 'Publish Listings' : 'Next Crop'}
                </Text>
                <MaterialIcons
                  name={currentIndex === selectedProducts.length - 1 ? 'check' : 'arrow-forward'}
                  size={18}
                  color="white"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PriceQuantityInputScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#888', fontSize: 15 },
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
  scroll: { flex: 1 },
  progressCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    elevation: 1,
  },
  progressText: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
  },
  cropImage: { width: 56, height: 56, borderRadius: 10 },
  cropName: { fontSize: 18, fontWeight: '700', color: '#2c5530' },
  cropMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  form: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 18,
    elevation: 1,
  },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingLeft: 12,
  },
  currency: { fontSize: 15, fontWeight: '700', color: '#4CAF50', marginRight: 8 },
  priceInput: { flex: 1, padding: 12, fontSize: 17, fontWeight: '700', color: '#333' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: '#aaa', marginTop: 4, fontStyle: 'italic' },
  preview: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginTop: 8,
  },
  previewLabel: { fontSize: 12, fontWeight: '600', color: '#1976D2', marginBottom: 4 },
  previewText: { fontSize: 13, color: '#333', fontWeight: '600' },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    gap: 10,
    elevation: 5,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  prevBtnText: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  nextBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  nextBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});

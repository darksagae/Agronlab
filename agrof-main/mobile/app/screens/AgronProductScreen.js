import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { PRICE_NOTE } from '../data/agronCatalog';

const { width } = Dimensions.get('window');

const AgronProductScreen = ({ product, onBack, onAddToCart }) => {
  const lines = product?.lines;
  const firstLine = lines?.[0];

  const [lineId, setLineId] = useState(firstLine?.id ?? 'standard');
  const activeLine = useMemo(
    () => lines?.find((l) => l.id === lineId) ?? firstLine,
    [lines, lineId, firstLine]
  );

  const [colorId, setColorId] = useState(activeLine?.colors?.[0]?.id ?? 'default');
  const selectedColor = useMemo(
    () => activeLine?.colors?.find((c) => c.id === colorId) ?? activeLine?.colors?.[0],
    [activeLine, colorId]
  );

  const [packSize, setPackSize] = useState('');

  useEffect(() => {
    if (!activeLine?.colors?.length) return;
    const valid = activeLine.colors.some((c) => c.id === colorId);
    if (!valid) setColorId(activeLine.colors[0].id);
  }, [activeLine]);

  useEffect(() => {
    if (product?.storageOptions?.length && !packSize) {
      setPackSize(product.storageOptions[0]);
    }
  }, [product]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.miss}>
          <Text style={styles.missText}>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasDualLine = (lines?.length ?? 0) > 1;
  const unitPrice = activeLine?.price ?? product.price;
  const configLabel = product.purchaseOptionLabel ?? 'Pack size';
  const heroImage = selectedColor?.image ?? product.listImage;

  const handleAddToCart = () => {
    if (!packSize) {
      Alert.alert(`Choose ${configLabel}`, 'Select an option to continue.');
      return;
    }
    const variantLabel = selectedColor?.label ?? 'Standard';
    const lineLabel = activeLine?.label ?? product.name;
    const summary = `${lineLabel} · ${variantLabel} · ${packSize}\n${unitPrice}`;

    if (onAddToCart) {
      onAddToCart({ product, lineId, colorId, packSize });
    } else {
      Alert.alert('Added to Bag', summary, [{ text: 'OK', onPress: onBack }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image — white panel */}
        <View style={styles.heroWrap}>
          <Image source={heroImage} style={styles.hero} resizeMode="contain" />
        </View>

        <View style={styles.panel}>
          {/* Price */}
          <Text style={styles.price}>{unitPrice}</Text>
          <Text style={styles.subprice}>Indicative price · Kampala market</Text>

          {/* Title */}
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.subtitle}>{product.subtitle}</Text>

          {/* Standard / Pro segment */}
          {hasDualLine && (
            <View style={styles.segment}>
              {lines.map((ln) => {
                const active = ln.id === lineId;
                return (
                  <TouchableOpacity
                    key={ln.id}
                    style={[styles.segBtn, active && styles.segBtnOn]}
                    onPress={() => setLineId(ln.id)}
                  >
                    <Text style={[styles.segTxt, active && styles.segTxtOn]}>{ln.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {activeLine?.subtitle ? (
            <Text style={styles.lineHint}>{activeLine.subtitle}</Text>
          ) : null}

          {/* Color / variant swatches */}
          {activeLine && (activeLine.colors?.length ?? 0) > 1 && (
            <>
              <Text style={styles.sectionLabel}>Variant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                {activeLine.colors.map((c) => {
                  const on = c.id === colorId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.colorChip, on && styles.colorChipOn]}
                      onPress={() => setColorId(c.id)}
                    >
                      <Image source={c.image} style={styles.colorThumb} resizeMode="contain" />
                      <Text style={[styles.colorLbl, on && styles.colorLblOn]} numberOfLines={2}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Pack size / storage chips */}
          <Text style={styles.sectionLabel}>{configLabel}</Text>
          <View style={styles.packRow}>
            {product.storageOptions.map((s) => {
              const on = s === packSize;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.packChip, on && styles.packChipOn]}
                  onPress={() => setPackSize(s)}
                >
                  <Text style={[styles.packTxt, on && styles.packTxtOn]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Highlights */}
          <Text style={styles.sectionLabel}>Highlights</Text>
          {product.highlights.map((h) => (
            <Text key={h} style={styles.bullet}>· {h}</Text>
          ))}

          {/* Description */}
          <Text style={styles.desc}>{product.description}</Text>

          <Text style={styles.footnote}>{PRICE_NOTE}</Text>

          {/* CTA */}
          <TouchableOpacity style={styles.cta} onPress={handleAddToCart} activeOpacity={0.9}>
            <Text style={styles.ctaText}>Add to Bag</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AgronProductScreen;

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
  heroWrap: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  hero: {
    width: width - 24,
    height: width - 24,
    maxHeight: 340,
  },
  panel: {
    padding: 16,
    paddingBottom: 48,
  },
  price: {
    color: '#22c55e',
    fontSize: 26,
    fontWeight: '800',
  },
  subprice: {
    color: '#525252',
    fontSize: 11,
    marginTop: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    color: '#a3a3a3',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  segment: {
    flexDirection: 'row',
    marginTop: 16,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2d1f',
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#050d05',
  },
  segBtnOn: {
    backgroundColor: '#16a34a',
  },
  segTxt: {
    color: '#737373',
    fontSize: 13,
    fontWeight: '700',
  },
  segTxtOn: {
    color: '#ffffff',
  },
  lineHint: {
    color: '#525252',
    fontSize: 12,
    marginTop: 8,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  colorScroll: {
    flexDirection: 'row',
  },
  colorChip: {
    width: 88,
    marginRight: 10,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1f2d1f',
    backgroundColor: '#050d05',
    alignItems: 'center',
  },
  colorChipOn: {
    borderColor: '#22c55e',
    backgroundColor: '#052e16',
  },
  colorThumb: {
    width: 56,
    height: 56,
    marginBottom: 6,
  },
  colorLbl: {
    color: '#737373',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  colorLblOn: {
    color: '#22c55e',
    fontWeight: '700',
  },
  packRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1f2d1f',
    backgroundColor: '#050d05',
  },
  packChipOn: {
    borderColor: '#22c55e',
    backgroundColor: '#16a34a',
  },
  packTxt: {
    color: '#a3a3a3',
    fontSize: 13,
    fontWeight: '600',
  },
  packTxtOn: {
    color: '#ffffff',
  },
  bullet: {
    color: '#d4d4d4',
    fontSize: 14,
    lineHeight: 22,
  },
  desc: {
    color: '#737373',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
  footnote: {
    color: '#404040',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  cta: {
    marginTop: 28,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  miss: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missText: {
    color: '#525252',
    fontSize: 16,
  },
});

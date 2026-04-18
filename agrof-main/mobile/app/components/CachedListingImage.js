import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useListingImageUrl } from '../lib/media/useListingImageUrl';

/**
 * Renders a listing photo from an S3 **key** (not raw bytes). Uses presigned URL + expo-image disk/memory cache
 * so scrolling lists does not re-download on every pass (important on slower networks).
 */
export function CachedListingImage({
  storageKey,
  style,
  placeholderColor = '#e0e0e0',
  ...rest
}) {
  const { data: uri, isLoading, isError } = useListingImageUrl(storageKey, Boolean(storageKey));

  if (!storageKey || isError) {
    return <View style={[styles.ph, { backgroundColor: placeholderColor }, style]} />;
  }

  if (isLoading || !uri) {
    return (
      <View style={[styles.ph, { backgroundColor: placeholderColor }, style]}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={200}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  ph: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

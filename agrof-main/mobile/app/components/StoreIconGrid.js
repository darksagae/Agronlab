import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { getUrl } from 'aws-amplify/storage';

// AGRON global store — always the first icon, hardcoded
const AGRON_STORE = {
  id: 'agron',
  name: 'AGRON',
  tagline: 'Official Global Store',
};

function StoreIcon({ store, onPress }) {
  const [logoUri, setLogoUri] = React.useState(null);

  React.useEffect(() => {
    if (store.logoKey) {
      getUrl({ path: store.logoKey })
        .then(r => setLogoUri(r.url.toString()))
        .catch(() => setLogoUri(null));
    }
  }, [store.logoKey]);

  const initials = store.name.slice(0, 2).toUpperCase();
  const isAgron = store.id === 'agron';

  return (
    <TouchableOpacity style={styles.iconWrapper} onPress={() => onPress(store)}>
      {logoUri ? (
        <Image source={{ uri: logoUri }} style={styles.iconImage} />
      ) : (
        <View style={[styles.iconCircle, isAgron && styles.agronCircle]}>
          {isAgron ? (
            <Text style={styles.agronLetter}>A</Text>
          ) : (
            <Text style={styles.initials}>{initials}</Text>
          )}
        </View>
      )}
      <Text style={styles.iconName} numberOfLines={1}>{store.name}</Text>
      {store.tagline ? (
        <Text style={styles.iconTagline} numberOfLines={1}>{store.tagline}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function StoreIconGrid({ stores = [], loading = false, onSelect }) {
  const items = [AGRON_STORE, ...stores];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Store</Text>
      {loading && stores.length === 0 ? (
        <ActivityIndicator color="#4CAF50" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <StoreIcon store={item} onPress={onSelect} />
          )}
          contentContainerStyle={styles.grid}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    alignItems: 'flex-start',
  },
  iconWrapper: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#a5d6a7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  agronCircle: {
    backgroundColor: '#2c5530',
    borderColor: '#4CAF50',
  },
  iconImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 6,
  },
  initials: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c5530',
  },
  agronLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  iconName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    maxWidth: 80,
  },
  iconTagline: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    maxWidth: 80,
  },
});

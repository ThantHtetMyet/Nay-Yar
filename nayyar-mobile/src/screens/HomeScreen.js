import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getListings } from '../services/api';

const HomeScreen = ({ route }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = route.params?.user;

  const fetchListings = async () => {
    try {
      const data = await getListings();
      setListings(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.ImageURL ? (
        <Image source={{ uri: item.ImageURL }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.details}>
        <Text style={styles.price}>{item.Currency} {item.Price}</Text>
        <Text style={styles.type}>{item.PropertyType} - {item.ListingType}</Text>
        <Text style={styles.address} numberOfLines={2}>{item.Address}, {item.City}</Text>
        <Text style={styles.meta}>{item.Bedrooms} Beds • {item.Bathrooms} Baths • {item.AreaSize} sqft</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {user?.FullName || 'Guest'}</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.PropertyID}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No listings found.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  details: {
    padding: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
});

export default HomeScreen;

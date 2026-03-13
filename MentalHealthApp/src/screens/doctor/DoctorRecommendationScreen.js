import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProviderCard } from './components/ProviderCard';
import { useProviderFinder } from './hooks/useProviderFinder';

export default function DoctorRecommendationScreen() {
  const {
    query,
    setQuery,
    location,
    setLocation,
    serviceType,
    setServiceType,
    loading,
    error,
    providers,
    usingMyLocation,
    radiusKm,
    runSearch,
    enableMyLocation,
    disableMyLocation,
  } = useProviderFinder({ radiusKm: 10 });

  const renderItem = ({ item }) => <ProviderCard provider={item} />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={providers}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Health Care Provider Finder</Text>
              <Text style={styles.subtitle}>Search by location and service type.</Text>
            </View>

            <View style={styles.locationRow}>
              {usingMyLocation ? (
                <TouchableOpacity style={styles.locationButton} onPress={disableMyLocation} disabled={loading}>
                  <Ionicons name="locate" size={16} color="#0f172a" />
                  <Text style={styles.locationButtonText}>Stop using my location</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.locationButton} onPress={enableMyLocation} disabled={loading}>
                  <Ionicons name="locate" size={16} color="#0f172a" />
                  <Text style={styles.locationButtonText}>Use my current location</Text>
                </TouchableOpacity>
              )}
              {usingMyLocation ? (
                <Text style={styles.locationHint}>Searching within {radiusKm} km of your current location</Text>
              ) : (
                <Text style={styles.locationHint}>Or type a city/area in the field below</Text>
              )}
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Provider name (optional)"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={() => runSearch()}
              />
            </View>

        

            <TouchableOpacity style={styles.searchButton} onPress={runSearch} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.searchButtonText}>Search</Text>
                </>
              )}
            </TouchableOpacity>

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && providers?.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No providers found</Text>
                <Text style={styles.emptyText}>Try different location or service type.</Text>
              </View>
            )}

            <View style={styles.header}>
              <Text style={styles.sectionTitle}>Results</Text>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationHint: {
    marginLeft: 10,
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    textAlign: 'right',
  },
  criteriaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  criteriaField: {
    flex: 1,
    marginRight: 10,
  },
  criteriaLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  criteriaInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    marginBottom: 12,
  },
  errorText: {
    marginLeft: 8,
    color: '#7f1d1d',
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
});

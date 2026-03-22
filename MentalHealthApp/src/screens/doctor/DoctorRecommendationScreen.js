import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProviderCard } from './components/ProviderCard';
import { FilterPanel } from './components/FilterPanel';
import { useProviderFinder } from './hooks/useProviderFinder';

export default function DoctorRecommendationScreen() {
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const {
    loading,
    error,
    locationWarning,
    providers,
    allProviders,
    usingMyLocation,
    filters,
    setFilters,
    refreshNearby,
  } = useProviderFinder();

  const renderItem = ({ item, index }) => <ProviderCard provider={item} />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={providers}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Health Care Provider Finder</Text>
              <Text style={styles.subtitle}>Nearby healthcare providers around your current location.</Text>
            </View>

            <View style={styles.locationRow}>
              <TouchableOpacity style={styles.locationButton} onPress={refreshNearby} disabled={loading}>
                <Ionicons name="locate" size={16} color="#0f172a" />
                <Text style={styles.locationButtonText}>Refresh</Text>
              </TouchableOpacity>
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                visible={showFilterModal}
                onClose={() => setShowFilterModal(!showFilterModal)}
              />
            </View>

            {allProviders.length > 0 && (
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsText}>
                  Showing {providers.length} of {allProviders.length} results
                </Text>
              </View>
            )}

            {!!locationWarning && (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={16} color="#1d4ed8" />
                <Text style={styles.infoText}>{locationWarning}</Text>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingTitle}>Finding nearby providers...</Text>
                <Text style={styles.loadingSubtitle}>Please wait while we fetch location-based results.</Text>
              </View>
            )}

            {!loading && !error && providers?.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No providers found</Text>
                <Text style={styles.emptyText}>Try different location or service type.</Text>
              </View>
            )}

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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    marginBottom: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    color: '#1E3A8A',
    fontSize: 13,
    flex: 1,
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
  loadingState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  loadingSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
  resultsInfo: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});

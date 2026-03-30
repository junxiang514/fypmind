import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProviderCard } from './components/ProviderCard';
import { FilterPanel } from './components/FilterPanel';
import LocationConsentModal from './components/LocationConsentModal';
import { useProviderFinder } from './hooks/useProviderFinder';
import { getProviderFinderPreferences, saveProviderFinderPreferences } from '../../lib/providerFinderPreferences';

export default function DoctorRecommendationScreen() {
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [consentOpen, setConsentOpen] = React.useState(false);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const initializedRef = React.useRef(false);
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

  const handleFindNearbyPress = React.useCallback(async () => {
    try {
      const saved = await getProviderFinderPreferences();
      if (saved?.autoUseLocation) {
        refreshNearby();
        return;
      }
    } catch (err) {
      // Fallback to prompt.
    }
    setConsentOpen(true);
  }, [refreshNearby]);

  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const saved = await getProviderFinderPreferences();
        if (saved?.autoUseLocation) {
          await refreshNearby();
          return;
        }
      } catch (err) {
        // fall back to prompt
      }
    })();
  }, [refreshNearby]);

  const handleAllowLocation = React.useCallback(async () => {
    try {
      await saveProviderFinderPreferences({ autoUseLocation: !!dontShowAgain });
    } catch (err) {
      // Non-blocking.
    }

    setConsentOpen(false);
    setDontShowAgain(false);
    refreshNearby();
  }, [dontShowAgain, refreshNearby]);

  const handleNotNow = React.useCallback(async () => {
    try {
      await saveProviderFinderPreferences({ autoUseLocation: false });
    } catch (err) {
      // Non-blocking.
    }

    setConsentOpen(false);
    setDontShowAgain(false);
  }, []);

  const renderItem = ({ item, index }) => <ProviderCard provider={item} />;

  const handleRefreshNowPress = React.useCallback(() => {
    if (!usingMyLocation) return;
    refreshNearby();
  }, [refreshNearby, usingMyLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <LocationConsentModal
        visible={consentOpen}
        dontShowAgain={dontShowAgain}
        onToggleDontShowAgain={() => setDontShowAgain((v) => !v)}
        onAllow={handleAllowLocation}
        onNotNow={handleNotNow}
        onClose={handleNotNow}
      />

      <FlatList
        data={providers}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTitleRow}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons name="medkit-outline" size={18} color="#0369a1" />
                  </View>
                  <Text style={styles.title}>Health Care Provider Finder</Text>
                </View>
                <Text style={styles.subtitle}>Enable location access to find nearby healthcare providers around you.</Text>
              </View>

              <View style={styles.heroActionsRow}>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={[styles.locationButton, (!usingMyLocation || loading) && styles.locationButtonDisabled]}
                    onPress={handleRefreshNowPress}
                    disabled={!usingMyLocation || loading}
                  >
                    <Ionicons name="refresh" size={16} color="#0f172a" />
                    <Text style={styles.locationButtonText}>Refresh</Text>
                  </TouchableOpacity>
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(!showFilterModal)}
                  />
                </View>
              </View>
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

            {!loading && !usingMyLocation && (
              <View style={styles.enableLocationCard}>
                <View style={styles.enableLocationIconWrap}>
                  <Ionicons name="locate" size={20} color="#1d4ed8" />
                </View>
                <Text style={styles.enableLocationTitle}>Enable location now</Text>
                <Text style={styles.enableLocationText}>
                  We need location access to show nearby providers. Your location is only used for provider search.
                </Text>
                <TouchableOpacity style={styles.enableLocationButton} onPress={handleFindNearbyPress}>
                  <Text style={styles.enableLocationButtonText}>Enable location now</Text>
                </TouchableOpacity>
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

            {!loading && !error && usingMyLocation && providers?.length === 0 && (
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
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
  },
  heroCard: {
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 15,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTopRow: {
    marginBottom: 8,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    marginLeft: 8,
    color: '#1E3A8A',
    fontSize: 13,
    flex: 1,
  },
  enableLocationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  enableLocationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  enableLocationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  enableLocationText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 10,
  },
  enableLocationButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  enableLocationButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    marginLeft: 8,
    color: '#7f1d1d',
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingState: {
    backgroundColor: '#fff',
    borderRadius: 14,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultsText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
});

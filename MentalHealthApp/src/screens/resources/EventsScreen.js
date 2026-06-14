import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { listEvents, listMySavedEventIds } from '../../lib/events';

function formatDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatTimeOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function EventsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [mode, setMode] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rows, mySaved] = await Promise.all([
        listEvents({}),
        listMySavedEventIds(),
      ]);
      setItems(rows);
      setSavedIds(new Set(mySaved));
    } catch (err) {
      setError(err?.message || 'Failed to load events.');
      setItems([]);
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const now = new Date();
  const displayedItems = items.filter((item) => {
    const startDate = item?.start_at ? new Date(item.start_at) : null;
    const isPast = startDate ? startDate.getTime() < now.getTime() : false;

    if (mode === 'saved') return savedIds.has(String(item.id));
    if (mode === 'past') return isPast;
    return !isPast;
  });

  const renderItem = ({ item }) => {
    const title = item?.title || 'Untitled';
    const location = item?.location;
    const dateLabel = item?.start_at ? formatDateOnly(item.start_at) : null;
    const timeLabel = item?.start_at ? formatTimeOnly(item.start_at) : null;

    const imageUrls = Array.isArray(item?.image_urls)
      ? item.image_urls.filter((u) => typeof u === 'string' && u.trim())
      : [];
    const firstImage = imageUrls.length > 0 ? imageUrls[0] : null;

    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventDetail', { id: item.id })}>
        <View style={styles.imageColumn}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.eventImage} />
          ) : (
            <View style={styles.datePill}>
              <Ionicons name="calendar" size={26} color="#0f172a" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {!!dateLabel && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={14} color="#64748b" />
              <Text style={styles.metaLocation}>{dateLabel}</Text>
            </View>
          )}

          {!!timeLabel && (
            <View style={styles.metaRow}>
              <Ionicons name="time" size={14} color="#64748b" />
              <Text style={styles.metaLocation}>{timeLabel}</Text>
            </View>
          )}

          {!!location && (
            <View style={styles.metaRow}>
              <Ionicons name="location" size={14} color="#64748b" />
              <Text style={styles.metaLocation}>{location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Events & Activities</Text>
              <Text style={styles.headerSubtitle}>Discover upcoming activities that support your wellbeing.</Text>
            </View>

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, mode === 'upcoming' && styles.filterButtonActive]}
                onPress={() => setMode('upcoming')}
              >
                <Text style={[styles.filterButtonText, mode === 'upcoming' && styles.filterButtonTextActive]}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, mode === 'past' && styles.filterButtonActive]}
                onPress={() => setMode('past')}
              >
                <Text style={[styles.filterButtonText, mode === 'past' && styles.filterButtonTextActive]}>Past</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, mode === 'saved' && styles.filterButtonActive]}
                onPress={() => setMode('saved')}
              >
                <Text style={[styles.filterButtonText, mode === 'saved' && styles.filterButtonTextActive]}>Saved</Text>
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && displayedItems?.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptyText}>Try a different keyword.</Text>
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageColumn: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  datePill: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgePast: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  statusBadgeUpcoming: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextPast: {
    color: '#b91c1c',
  },
  statusTextUpcoming: {
    color: '#166534',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLocation: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  summary: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
});
